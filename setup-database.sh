#!/bin/bash

# Chocobar Database Setup Script
# This script creates the PostgreSQL database for Chocobar

echo "🍫 Setting up Chocobar database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Try to create database
echo "Creating database 'chocobar'..."

# Try with current user first
if psql -lqt | cut -d \| -f 1 | grep -qw chocobar; then
    echo "✅ Database 'chocobar' already exists."
else
    # Try different methods to create database
    if createdb chocobar 2>/dev/null; then
        echo "✅ Database 'chocobar' created successfully!"
    elif sudo -u postgres createdb chocobar 2>/dev/null; then
        echo "✅ Database 'chocobar' created successfully (via postgres user)!"
    else
        echo "⚠️  Could not create database automatically."
        echo ""
        echo "Please create the database manually using one of these methods:"
        echo ""
        echo "Method 1: Using psql"
        echo "  sudo -u postgres psql"
        echo "  CREATE DATABASE chocobar;"
        echo "  \\q"
        echo ""
        echo "Method 2: Using createdb command"
        echo "  sudo -u postgres createdb chocobar"
        echo ""
        echo "Method 3: Run the SQL script"
        echo "  sudo -u postgres psql -f create-database.sql"
        exit 1
    fi
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in your .env file"
echo "2. Run: npm run prisma:generate"
echo "3. Run: npm run prisma:migrate"
echo "4. (Optional) Run: npm run prisma:seed"

