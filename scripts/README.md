# Sample Data Generator for Pawnshop System

This script generates realistic sample data for the pawnshop system, including customers, items, loans, payments, and transactions.

## Requirements

- Python 3.8+
- Access to the pawnshop database
- Required Python packages: `faker`, `sqlalchemy`, `psycopg2`

## Installation

Install the required packages:

```bash
pip install faker sqlalchemy psycopg2-binary
```

## Usage

Run the script from the project root directory:

```bash
python scripts/generate_sample_data.py
```

### Command Line Options

- `--customers`: Number of customers to generate (default: 50)
- `--items`: Number of items to generate (default: 100)
- `--loans`: Number of loans to generate (default: 80)
- `--transactions`: Number of transactions to generate (default: 120)
- `--branches`: Number of branches to generate (default: 3)
- `--employees`: Number of employees to generate (default: 10)
- `--clear`: Clear existing data before generating new data

### Examples

Generate default amount of data:

```bash
python scripts/generate_sample_data.py
```

Generate a smaller dataset:

```bash
python scripts/generate_sample_data.py --customers 20 --items 40 --loans 30 --transactions 50
```

Clear existing data and generate new data:

```bash
python scripts/generate_sample_data.py --clear
```

## Data Distribution

The script generates data with the following characteristics:

- **Customers**: Random names, addresses, contact information
- **Items**: Various categories (jewelry, electronics, etc.) with realistic appraised values
- **Loans**: Mix of active, overdue, completed, and defaulted loans
- **Payments**: Full payments for completed loans, partial payments for active/overdue loans
- **Transactions**: Sales transactions for sold items, plus other transaction types

## Database Connection

By default, the script connects to a PostgreSQL database at `postgresql://postgres:postgres@localhost/pawnshop`. 

You can override this by setting the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://username:password@hostname/dbname"
python scripts/generate_sample_data.py
```

## Troubleshooting

If you encounter errors:

1. Make sure the database is running and accessible
2. Check that all required tables exist in the database
3. Verify that the database URL is correct
4. Ensure you have the necessary permissions to modify the database
