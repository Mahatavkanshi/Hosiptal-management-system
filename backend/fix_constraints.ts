import { query } from './src/config/database';

const fixConstraints = async () => {
  try {
    console.log('Checking current constraints on users table...');
    
    // Check current constraints
    const constraints = await query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass
    `);
    
    console.log('Current constraints:');
    constraints.rows.forEach((row: any) => {
      console.log(`  - ${row.conname}: ${row.definition}`);
    });

    // Check if there's a unique constraint on email only
    const emailConstraint = constraints.rows.find((row: any) => 
      row.conname.includes('email') && 
      !row.conname.includes('role') &&
      row.definition.includes('UNIQUE')
    );

    if (emailConstraint) {
      console.log(`\nFound old unique constraint: ${emailConstraint.conname}`);
      console.log('Dropping old constraint...');
      
      await query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS "${emailConstraint.conname}"
      `);
      console.log('✓ Dropped old constraint');
    }

    // Try to add new composite constraint
    try {
      console.log('\nAdding new email+role unique constraint...');
      await query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_email_role_key UNIQUE (email, role)
      `);
      console.log('✓ Added new composite unique constraint');
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log('✓ Composite constraint already exists');
      } else if (err.message?.includes('could not create unique index')) {
        console.log('\n⚠️  WARNING: Cannot create composite constraint because duplicate emails exist in the database.');
        console.log('You need to either:');
        console.log('  1. Delete duplicate email entries manually, OR');
        console.log('  2. Use different emails for testing');
        console.log('\nFor now, the backend will handle this gracefully.');
      } else {
        throw err;
      }
    }

    // Verify final state
    const finalConstraints = await query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass
    `);
    
    console.log('\nFinal constraints:');
    finalConstraints.rows.forEach((row: any) => {
      console.log(`  - ${row.conname}: ${row.definition}`);
    });

    console.log('\n✅ Database constraints check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing constraints:', error);
    process.exit(1);
  }
};

fixConstraints();
