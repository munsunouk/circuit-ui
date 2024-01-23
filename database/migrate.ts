import 'dotenv/config';
import { migrate } from 'drizzle-orm/mysql2/migrator';

import { connection, db } from './connect';

const main = async () => {
	console.log('Starting migration of database...');

	// This will run migrations on the database, skipping the ones already applied
	// @ts-ignore
	await migrate(db, { migrationsFolder: './drizzle' });
	// Don't forget to close the connection, otherwise the script will hang
	await connection.end();

	console.log('Migration of database completed!');
};

main();
