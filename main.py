import eel
from datetime import date
from modules.db import Database
import pandas as pd
import os
import subprocess
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

eel.init('web')

#initialize database
db = Database('database/db.db')

#define client's table
create_client_table = """
CREATE TABLE IF NOT EXISTS client_history (
    client_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_name TEXT NOT NULL,
    bill_number TEXT NOT NULL,
    ship_name TEXT NOT NULL,
    ship_city TEXT NOT NULL,
    bill_path TEXT GENERATED ALWAYS AS ('invoice/client_id_' || client_id || '.pdf') VIRTUAL,
    created_at TEXT
)
"""

create_winter_table = """
CREATE TABLE IF NOT EXISTS winter_stock (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_desc TEXT NOT NULL,
    date TEXT NOT NULL,
    stock_inflow INTEGER DEFAULT 0,
    stock_outflow INTEGER DEFAULT 0,
    remaining_stock INTEGER
)
"""
create_summer_table = """
CREATE TABLE IF NOT EXISTS summer_stock (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_desc TEXT NOT NULL,
    date TEXT NOT NULL,
    stock_inflow INTEGER DEFAULT 0,
    stock_outflow INTEGER DEFAULT 0,
    remaining_stock INTEGER
)
"""

create_balance_table = """
CREATE TABLE IF NOT EXISTS balance_table (
    balance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance_number TEXT NOT NULL,
    date TEXT NOT NULL,
    debit REAL,
    credit REAL,
    remaining_balance REAL
)
"""

@eel.expose  # Expose this function to be callable from JavaScript
def create_bill(formData):
    # Jinja Environment
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('invoice_template.html')

    relative_logo_path = "../templates/logo.png"
    absolute_logo_path = os.path.abspath(relative_logo_path)

    today = date.today()
    
    insert_query = "INSERT INTO client_history (bill_name, bill_number, ship_name, ship_city, created_at) VALUES (?, ?, ?, ?, ?)"
    invoice_number = db.insert_data('client_history', create_client_table, insert_query, (formData['bill-name'], formData['bill-number'], formData['ship-name'], formData['ship-city'], today))
    file_name = f"client_id_{invoice_number}.pdf"
    file_path = f"invoice/{file_name}"

    data = {
        'bill_name': formData['bill-name'].capitalize(),
        'invoice_number': invoice_number,
        'bill_number': formData['bill-number'],
        'date': today,
        'logo': absolute_logo_path
    }

    # Table Header and Blank Data Rows
    items = []

    subTotal = 0

    # Add empty rows (14 total) for blank fields
    if type(formData["item-description"]) == list:
        for i in range(len(formData["item-description"])):
            totalItemPrice = round(int(formData['item-qty'][i]) * float(formData['item-price'][i]), 2)
            subTotal += totalItemPrice
            items.append([str(i + 1), formData['item-description'][i], formData['item-qty'][i], formData['item-price'][i], "{:,.2f}".format(totalItemPrice)])


    else:
        totalItemPrice = round(int(formData['item-qty']) * float(formData['item-price']), 2)
        subTotal += totalItemPrice
        items.append(["1", formData['item-description'], formData['item-qty'], formData['item-price'], "{:,.2f}".format(totalItemPrice)])


    serialNum = len(items)

    while serialNum < 10:
        items.append([str(serialNum+1), "", "", "", ""])
        serialNum+=1

    data['item_list'] = items
    data['total'] = "{:,.2f}".format(round(subTotal, 2))


    html_content = template.render(data)

    HTML(string=html_content, base_url = 'templates').write_pdf(file_path)
    return 1



@eel.expose
def add_new_product_record(formData, season):
    today = date.today()

    collection = 'winterCollection' if season == 'winter_stock' else 'summerCollection'
    create_table = create_winter_table if season == 'winter_stock' else create_summer_table

    select_query = f"SELECT remaining_stock FROM {season} WHERE product_desc = ? ORDER BY product_id DESC"
    previous_data = db.fetch_data(select_query, (formData[collection],), limit=1)
    if len(previous_data) > 0:
        print(f"previous_data: {previous_data[0][0]}")
        remaining_stock = previous_data[0][0] + int(formData['stock-inflow']) - int(formData['stock-outflow'])

    else:
        remaining_stock = int(formData['stock-inflow']) - int(formData['stock-outflow'])
    print(remaining_stock)

    insert_query = f"INSERT INTO {season} (product_desc, date, stock_inflow, stock_outflow, remaining_stock) VALUES (?, ?, ?, ?, ?)"
    invoice_number = db.insert_data(f'{season}', create_table, insert_query, (formData[collection], today, formData['stock-inflow'], formData['stock-outflow'], remaining_stock))




@eel.expose
def get_product_records(product_desc, season):
    print(product_desc)
    try:
        select_query = f"""
        SELECT date, stock_inflow, stock_outflow, remaining_stock
        FROM {season}
        WHERE product_desc = ?
        ORDER BY product_id DESC;
        """
        results = db.fetch_data(select_query, (product_desc,))
        print(results)
        return results

    except Exception as e:
        print(f'Database error: {e}')
        return []
        

@eel.expose
def get_client_record(telephone, record_type):
    print(telephone)
    try:
        
        if telephone == "remaining":
            select_invoice_history = """
            SELECT bill_number, created_at, bill_path
            FROM client_history
            ORDER BY client_id DESC
            """
            select_balance_history = f"""
            SELECT 
                b.balance_number, 
                b.date, 
                b.debit, 
                b.credit, 
                b.remaining_balance
            FROM balance_table b
            WHERE b.balance_id = (
                SELECT MAX(balance_id)
                FROM balance_table
                WHERE balance_number = b.balance_number
            ) 
            AND b.remaining_balance < 0;
            """
            results = db.fetch_data(select_invoice_history if record_type == 'invoice' else select_balance_history, ())
        else:
            select_invoice_history = f"""
            SELECT bill_number, created_at, bill_path
            FROM client_history
            WHERE bill_number = ?
            ORDER BY client_id DESC
            """

            select_balance_history = f"""
            SELECT balance_number, date, debit, credit, remaining_balance
            FROM balance_table
            WHERE balance_number = ?
            ORDER BY balance_id DESC
            """
            results = db.fetch_data(select_invoice_history if record_type == 'invoice' else select_balance_history, (telephone,))

        print(results)
        return results

    except Exception as e:
        print(f'Database error: {e}')
        return []
        

# Manage balance
@eel.expose
def manage_balance(formData):
    today = date.today()

    create_table = create_balance_table

    select_query = f"SELECT remaining_balance FROM balance_table WHERE balance_number = ? ORDER BY balance_id DESC"
    previous_data = db.fetch_data(select_query, (formData['telephone'],), limit=1)
    if len(previous_data) > 0:
        print(f"previous_data: {previous_data[0][0]}")
        remaining_balance = previous_data[0][0] + float(formData['credit']) - float(formData['debit'])

    else:
        remaining_balance = float(formData['credit']) - float(formData['debit'])
    print(remaining_balance)

    insert_query = f"INSERT INTO balance_table (balance_number, date, credit, debit, remaining_balance) VALUES (?, ?, ?, ?, ?)"
    invoice_number = db.insert_data('balance_table', create_table, insert_query, (formData['telephone'], today, formData['credit'], formData['debit'], remaining_balance))



#open file
@eel.expose
def open_file(file_name):
    # Construct the full path to the file
    file_path = os.path.join(os.getcwd(), "", file_name)
    
    try:
        if os.path.exists(file_path):
            # Open the file with the default application
            if os.name == 'nt':  # Windows
                os.startfile(file_path)
            elif os.name == 'posix':  # macOS or Linux
                subprocess.run(["xdg-open", file_path])  # Linux
                # subprocess.run(["open", file_path])  # macOS
            print(f"Opened file: {file_path}")
        else:
            print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error opening file: {e}")


eel.start('main.html', size=(1920, 1080))