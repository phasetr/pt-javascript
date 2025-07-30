import { getDB } from '@/db/connection';
import { numbers } from '@/db/schema';

export default async function HomePage() {
  try {
    const db = getDB();
    const allNumbers = await db.select().from(numbers).orderBy(numbers.createdAt);

    return (
      <div>
        <h2>Numbers List</h2>
        {allNumbers.length === 0 ? (
          <p>No numbers found. Please seed the database first.</p>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {allNumbers.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  margin: '10px 0',
                  borderRadius: '5px',
                }}
              >
                <h3>{item.name}</h3>
                <p>Number: {item.number}</p>
                <p>Created: {item.createdAt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div>
        <h2>Error</h2>
        <p>Failed to load numbers: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Make sure the database is set up and seeded properly.</p>
      </div>
    );
  }
}