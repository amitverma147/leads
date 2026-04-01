import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default-org',
      settings: {
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
      },
    },
  });

  console.log('✅ Organization created:', organization.name);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadgen.com' },
    update: {},
    create: {
      email: 'admin@leadgen.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '9999999999',
      role: Role.admin,
      isEmailVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create marketing manager
  const managerPasswordHash = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@leadgen.com' },
    update: {},
    create: {
      email: 'manager@leadgen.com',
      passwordHash: managerPasswordHash,
      firstName: 'Marketing',
      lastName: 'Manager',
      phone: '9999999998',
      role: Role.marketing_manager,
      isEmailVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Marketing manager created:', manager.email);

  // Create field agent
  const agentPasswordHash = await bcrypt.hash('Agent@123', 12);
  const agent = await prisma.user.upsert({
    where: { email: 'agent@leadgen.com' },
    update: {},
    create: {
      email: 'agent@leadgen.com',
      passwordHash: agentPasswordHash,
      firstName: 'Field',
      lastName: 'Agent',
      phone: '9999999997',
      role: Role.field_agent,
      isEmailVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Field agent created:', agent.email);

  // Create default form
  const form = await prisma.form.upsert({
    where: { id: 'default-lead-form' },
    update: {},
    create: {
      id: 'default-lead-form',
      name: 'Default Lead Collection Form',
      description: 'Standard form for collecting lead information',
      organizationId: organization.id,
      isPublished: true,
      fields: [
        {
          id: 'first_name',
          type: 'text',
          label: 'First Name',
          placeholder: 'Enter first name',
          required: true,
          order: 1,
        },
        {
          id: 'last_name',
          type: 'text',
          label: 'Last Name',
          placeholder: 'Enter last name',
          required: false,
          order: 2,
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: 'Enter 10-digit phone number',
          required: true,
          order: 3,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter email address',
          required: false,
          order: 4,
        },
        {
          id: 'interest',
          type: 'dropdown',
          label: 'Interested In',
          required: true,
          order: 5,
          options: [
            { label: 'Product A', value: 'product_a' },
            { label: 'Product B', value: 'product_b' },
            { label: 'Product C', value: 'product_c' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          id: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
          placeholder: 'Enter any additional information',
          required: false,
          order: 6,
        },
      ],
    },
  });

  console.log('✅ Default form created:', form.name);

  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '9876543210',
        status: 'new',
        source: 'field_collection',
        priority: 'high',
        score: 75,
        organizationId: organization.id,
        createdById: agent.id,
        formData: {
          interest: 'product_a',
          notes: 'Very interested in the premium plan',
        },
        latitude: 28.6139,
        longitude: 77.209,
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
    }),
    prisma.lead.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '9876543211',
        status: 'contacted',
        source: 'field_collection',
        priority: 'medium',
        score: 60,
        organizationId: organization.id,
        createdById: agent.id,
        assignedToId: manager.id,
        formData: {
          interest: 'product_b',
        },
        latitude: 28.5355,
        longitude: 77.391,
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
    }),
    prisma.lead.create({
      data: {
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '9876543212',
        status: 'qualified',
        source: 'website',
        priority: 'urgent',
        score: 90,
        organizationId: organization.id,
        createdById: admin.id,
        assignedToId: manager.id,
        formData: {
          interest: 'product_c',
          notes: 'Ready to purchase',
        },
      },
    }),
  ]);

  console.log('✅ Sample leads created:', leads.length);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@leadgen.com / Admin@123');
  console.log('   Manager: manager@leadgen.com / Manager@123');
  console.log('   Agent: agent@leadgen.com / Agent@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });