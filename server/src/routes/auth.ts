import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    // Determine user role
    const { data: adminProfile } = await supabaseAdmin
      .from('admin_profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    let role = 'tenant';
    let profile: any = null;

    if (adminProfile) {
      role = adminProfile.role;
      profile = adminProfile;
    } else {
      const { data: tenantProfile } = await supabaseAdmin
        .from('tenants')
        .select(`
          *,
          account:accounts(
            *,
            room:rooms(
              *,
              building:buildings(*)
            )
          )
        `)
        .eq('auth_user_id', data.user.id)
        .single();

      if (tenantProfile) {
        profile = tenantProfile;
      }
    }

    if (!adminProfile && !profile) {
      res.status(403).json({ error: 'No associated landlord or tenant profile found in the database.' });
      return;
    }

    // Check if tenant account is pending approval
    if (!adminProfile && profile?.status === 'inactive') {
      res.status(403).json({
        error: 'Your tenant account is pending landlord approval. Please wait for management to verify your contract and documents.',
      });
      return;
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        profile,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * GET /api/auth/signup-options
 * Public endpoint to fetch available buildings and rooms for tenant signup
 */
router.get('/signup-options', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: buildings, error } = await supabaseAdmin
      .from('buildings')
      .select(`
        id,
        name,
        address,
        rooms (
          id,
          room_number,
          floor,
          monthly_rate,
          status
        )
      `)
      .order('name');

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ buildings: buildings || [] });
  } catch (err: any) {
    console.error('Signup options error:', err);
    res.status(500).json({ error: 'Failed to load signup options' });
  }
});

/**
 * POST /api/auth/register
 * Public registration for tenants with lease contracts (sets status: 'inactive' pending landlord approval)
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    let { email, password, firstName, lastName, fullName, phone, roomId, moveInDate } = req.body;

    if (!firstName && fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0] || 'Tenant';
      lastName = parts.slice(1).join(' ') || 'User';
    }

    if (!email || !password || !firstName || !lastName || !roomId) {
      res.status(400).json({ error: 'First name, last name, email, password, and room selection are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if tenant email already exists
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingTenant) {
      res.status(400).json({ error: 'A tenant registration with this email already exists.' });
      return;
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('id, building_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      res.status(404).json({ error: 'Selected room not found.' });
      return;
    }

    // Find or create account for room
    let { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('room_id', roomId)
      .single();

    if (!account) {
      const { data: newAccount, error: accError } = await supabaseAdmin
        .from('accounts')
        .insert({
          room_id: roomId,
          primary_email: cleanEmail,
          status: 'inactive', // pending landlord approval
          move_in_date: moveInDate || new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

      if (accError) {
        res.status(400).json({ error: accError.message });
        return;
      }
      account = newAccount;
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    // Create tenant record with status = 'inactive' (Pending landlord approval)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        account_id: account.id,
        auth_user_id: authData.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        is_primary: true,
        status: 'inactive', // Pending landlord approval
      })
      .select(`
        *,
        account:accounts(
          *,
          room:rooms(
            *,
            building:buildings(*)
          )
        )
      `)
      .single();

    if (tenantError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(400).json({ error: tenantError.message });
      return;
    }

    res.status(201).json({
      message: 'Registration submitted successfully. Your account is pending landlord approval.',
      tenant,
    });
  } catch (err: any) {
    console.error('Public tenant registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/register-tenant
 * Register a new tenant user account (admin creates this)
 */
router.post('/register-tenant', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ error: 'Only admins can register tenants' });
      return;
    }

    const { email, password, firstName, lastName, phone, accountId, isPrimary } = req.body;

    if (!email || !password || !firstName || !lastName || !accountId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    // Create tenant record
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        account_id: accountId,
        auth_user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        is_primary: isPrimary || false,
      })
      .select()
      .single();

    if (tenantError) {
      // Clean up auth user if tenant creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(400).json({ error: tenantError.message });
      return;
    }

    // If primary, update account primary email
    if (isPrimary) {
      await supabaseAdmin
        .from('accounts')
        .update({ primary_email: email })
        .eq('id', accountId);
    }

    // Update room status to occupied
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('room_id')
      .eq('id', accountId)
      .single();

    if (account) {
      await supabaseAdmin
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', account.room_id);
    }

    res.status(201).json({ tenant });
  } catch (err: any) {
    console.error('Register tenant error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/register-admin
 * Register a new admin user (super_admin only)
 */
router.post('/register-admin', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super admins can register admins' });
      return;
    }

    const { email, password, fullName } = req.body;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_profiles')
      .insert({
        auth_user_id: authData.user.id,
        full_name: fullName,
        email,
        role: 'admin',
      })
      .select()
      .single();

    if (adminError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(400).json({ error: adminError.message });
      return;
    }

    res.status(201).json({ admin });
  } catch (err: any) {
    console.error('Register admin error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      const { data: profile } = await supabaseAdmin
        .from('admin_profiles')
        .select('*')
        .eq('auth_user_id', req.user.id)
        .single();

      res.json({ user: { ...req.user, profile } });
    } else {
      const { data: profile } = await supabaseAdmin
        .from('tenants')
        .select(`
          *,
          account:accounts(
            *,
            room:rooms(
              *,
              building:buildings(*)
            )
          )
        `)
        .eq('auth_user_id', req.user!.id)
        .single();

      res.json({ user: { ...req.user, profile } });
    }
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to get profile' });
  }
});

export default router;
