-- 1. Drop Legacy Lottery Objects
DROP FUNCTION IF EXISTS execute_weekly_lottery_draw(UUID);
DROP TABLE IF EXISTS lottery_entries CASCADE;
DROP TABLE IF EXISTS lottery_cards CASCADE;
DROP TABLE IF EXISTS lottery_rounds CASCADE;

-- 2. Build New Unified Coupon & Participant Schema

-- Table for Active Rounds
CREATE TABLE lottery_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_title TEXT NOT NULL DEFAULT 'السحب الأسبوعي',
    scheduled_draw_at TIMESTAMPTZ NOT NULL, -- Target: Friday 4:20 PM
    actual_draw_at TIMESTAMPTZ DEFAULT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'completed')),
    winner_most_coupons JSONB DEFAULT NULL,
    winner_random JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Registered Customers (Participants)
CREATE TABLE lottery_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    total_coupons INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Coupons Pool & Claims
CREATE TABLE lottery_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code TEXT UNIQUE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    round_id UUID REFERENCES lottery_rounds(id) ON DELETE SET NULL,
    claimed_by_user_id UUID REFERENCES lottery_users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Stored Procedure: Atomic Coupon Claiming
CREATE OR REPLACE FUNCTION claim_lottery_coupon(
    p_coupon_code TEXT,
    p_user_name TEXT,
    p_phone TEXT,
    p_round_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_coupon_id UUID;
    v_new_total INT;
BEGIN
    -- Check if round is active
    IF NOT EXISTS (SELECT 1 FROM lottery_rounds WHERE id = p_round_id AND status = 'active') THEN
        RETURN json_build_object('success', false, 'message', 'جولة السحب الحالية غير نشطة');
    END IF;

    -- Validate coupon validity and availability
    SELECT id INTO v_coupon_id
    FROM lottery_coupons
    WHERE coupon_code = UPPER(TRIM(p_coupon_code)) AND is_claimed = FALSE;

    IF v_coupon_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'الكوبون غير صحيح أو تم استخدامه مسبقاً');
    END IF;

    -- Upsert participant user record
    INSERT INTO lottery_users (full_name, phone_number, total_coupons)
    VALUES (p_user_name, p_phone, 1)
    ON CONFLICT (phone_number)
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        total_coupons = lottery_users.total_coupons + 1
    RETURNING id, total_coupons INTO v_user_id, v_new_total;

    -- Assign coupon to user and round
    UPDATE lottery_coupons
    SET is_claimed = TRUE,
        claimed_by_user_id = v_user_id,
        round_id = p_round_id,
        claimed_at = NOW()
    WHERE id = v_coupon_id;

    RETURN json_build_object(
        'success', true,
        'message', 'تم تسجيل الكوبون بنجاح!',
        'total_coupons', v_new_total
    );
END;
$$;

-- 4. Stored Procedure: Execute Lottery Draw
CREATE OR REPLACE FUNCTION execute_lottery_draw_v2(p_round_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_winner_most JSONB;
    v_winner_random JSONB;
    v_exclude_user_id UUID;
BEGIN
    -- 1. Winner with the highest count in the current round
    SELECT json_build_object(
        'user_id', u.id,
        'name', u.full_name,
        'phone', u.phone_number,
        'coupon_count', COUNT(c.id)
    ), u.id
    INTO v_winner_most, v_exclude_user_id
    FROM lottery_coupons c
    JOIN lottery_users u ON c.claimed_by_user_id = u.id
    WHERE c.round_id = p_round_id
    GROUP BY u.id, u.full_name, u.phone_number
    ORDER BY COUNT(c.id) DESC, MIN(c.claimed_at) ASC
    LIMIT 1;

    -- 2. Random winner from remaining claimed coupons (excluding winner 1)
    SELECT json_build_object(
        'user_id', u.id,
        'name', u.full_name,
        'phone', u.phone_number,
        'coupon_code', c.coupon_code
    )
    INTO v_winner_random
    FROM lottery_coupons c
    JOIN lottery_users u ON c.claimed_by_user_id = u.id
    WHERE c.round_id = p_round_id
      AND (v_exclude_user_id IS NULL OR u.id != v_exclude_user_id)
    ORDER BY RANDOM()
    LIMIT 1;

    -- Lock round and record winners
    UPDATE lottery_rounds
    SET status = 'completed',
        actual_draw_at = NOW(),
        winner_most_coupons = v_winner_most,
        winner_random = v_winner_random
    WHERE id = p_round_id;

    RETURN json_build_object(
        'success', true,
        'winner_most', v_winner_most,
        'winner_random', v_winner_random
    );
END;
$$;

-- 5. Helper function for admin to generate N coupons easily
CREATE OR REPLACE FUNCTION admin_generate_coupons(p_count INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
    v_code TEXT;
BEGIN
    FOR i IN 1..p_count LOOP
        -- Generate random 8 character string
        v_code := 'DA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Ignore conflicts to simplify
        BEGIN
            INSERT INTO lottery_coupons (coupon_code) VALUES (v_code);
            v_count := v_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- do nothing
        END;
    END LOOP;
    RETURN v_count;
END;
$$;

-- Create an initial active round if none exists
INSERT INTO lottery_rounds (status, scheduled_draw_at)
SELECT 'active', NOW() + INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM lottery_rounds WHERE status = 'active');
