import sqlite3
import os

class Database:
    def __init__(self, db_file):
        """Initialize the database connection. Creates the DB file if it doesn't exist."""
        self.connection = sqlite3.connect(db_file)
        self.cursor = self.connection.cursor()

    def insert_data(self, table_name, create_table_query, insert_query, data):
        """Create the table if it doesn't exist and insert data into the table."""
        try:
            # Create the table if it doesn't exist
            self.cursor.execute(create_table_query)
            self.connection.commit()

            # Insert data into the table
            self.cursor.execute(insert_query, data)
            self.connection.commit()
            print(f"Data inserted into {table_name} successfully.")
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error inserting data: {e}")

    def fetch_data(self, query, data, limit=None):
        """Fetch data from a table with an optional limit."""
        try:
            self.cursor.execute(query, data)
            if limit is not None:
                results = self.cursor.fetchmany(limit)
            else:
                results = self.cursor.fetchall()
            
            if not results:
                print("No records found.")
                return []
            
            return results
        except sqlite3.Error as e:
            print(f"Error fetching data: {e}")
            return []



    def close(self):
        """Close the database connection."""
        self.connection.close()
