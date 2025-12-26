-- ================================
--  TASK 1
-- ================================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Internal Operations' LIMIT 1),
    (SELECT tenant_id FROM projects WHERE name = 'Internal Operations' LIMIT 1),
    'Setup tenant onboarding flow',
    'Implement new registration & onboarding UX',
    'in_progress',
    'high',
    (SELECT id FROM users WHERE email = 'user1@demo.com'),
    CURRENT_DATE + INTERVAL '5 days',
    NOW(),
    NOW()
);

-- ================================
--  TASK 2
-- ================================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Internal Operations' LIMIT 1),
    (SELECT tenant_id FROM projects WHERE name = 'Internal Operations' LIMIT 1),
    'Define project templates',
    'Create reusable project templates',
    'todo',
    'medium',
    (SELECT id FROM users WHERE email = 'user2@demo.com'),
    CURRENT_DATE + INTERVAL '7 days',
    NOW(),
    NOW()
);

-- ================================
--  TASK 3
-- ================================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    (SELECT tenant_id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    'Setup ticket categories',
    'Define ticket priorities & routing',
    'todo',
    'low',
    (SELECT id FROM users WHERE email = 'user1@demo.com'),
    CURRENT_DATE + INTERVAL '4 days',
    NOW(),
    NOW()
);

-- ================================
--  TASK 4
-- ================================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    (SELECT tenant_id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    'Automate canned replies',
    'Create canned response library',
    'in_progress',
    'medium',
    (SELECT id FROM users WHERE email = 'user2@demo.com'),
    CURRENT_DATE + INTERVAL '6 days',
    NOW(),
    NOW()
);

-- ================================
--  TASK 5
-- ================================
INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    (SELECT tenant_id FROM projects WHERE name = 'Customer Support' LIMIT 1),
    'Daily metrics dashboard',
    'Implement dashboard for support KPIs',
    'todo',
    'high',
    (SELECT id FROM users WHERE email = 'user2@demo.com'),
    CURRENT_DATE + INTERVAL '10 days',
    NOW(),
    NOW()
);
