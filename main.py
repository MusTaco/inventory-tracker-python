import eel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from datetime import date
from modules.db import Database
import pandas as pd
import os
import subprocess

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

@eel.expose  # Expose this function to be callable from JavaScript
def create_bill(formData):
    today = date.today()
    
    insert_query = "INSERT INTO client_history (bill_name, bill_number, ship_name, ship_city, created_at) VALUES (?, ?, ?, ?, ?)"
    invoice_number = db.insert_data('client_history', create_client_table, insert_query, (formData['bill-name'], formData['bill-number'], formData['ship-name'], formData['ship-city'], today))
    file_name = f"client_id_{invoice_number}.pdf"
    file_path = f"invoice/{file_name}"

    # Create the PDF canvas
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter

    # Header Section
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.green)
    c.drawString(200, height - 50, "Danish Garments Manufacturer")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawString(200, height - 70, "Jaranawala Road Akhri Stop")
    c.drawString(200, height - 85, "Near Gulshan Sweet Bakery")
    c.drawString(200, height - 100, "Phone: +92 302 6015067")
    c.line(30, height - 110, width - 30, height - 110)

    # Invoice Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height - 140, "BILL TO:")
    c.drawString(300, height - 140, "SHIP TO:")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 160, f"Name: {formData['bill-name']}")
    c.drawString(300, height - 160, f"Name: {formData['ship-name']}")
    c.drawString(30, height - 175, f"Phone: {formData['bill-number']}")
    c.drawString(300, height - 175, f"City: {formData['ship-city']}")

    # Invoice Metadata
    c.drawString(30, height - 200, f"INVOICE #: {invoice_number}")
    c.drawString(200, height - 200, f"DATE: {today}")

    # Table Header and Blank Data Rows
    data = [
        ["ITEM #", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"],
    ]

    subTotal = 0

    # Add empty rows (14 total) for blank fields
    if type(formData["item-description"]) == list:
        for i in range(len(formData["item-description"])):
            totalItemPrice = int(formData['item-qty'][i]) * int(formData['item-price'][i])
            subTotal += totalItemPrice
            data.append([str(i + 1), formData['item-description'][i], formData['item-qty'][i], formData['item-price'][i], totalItemPrice])
        for i in range(len(formData["item-description"])-1, 14):
            data.append([str(i + 1), "", "", "", ""])

    else:
        totalItemPrice = int(formData['item-qty']) * int(formData['item-price'])
        subTotal += totalItemPrice
        data.append(["1", formData['item-description'], formData['item-qty'], formData['item-price'], totalItemPrice])
        for i in range(1, 14):
            data.append([str(i + 1), "", "", "", ""])


    # Add Subtotal and Total rows
    # data.append(["", "", "", "SUBTOTAL", ""])
    data.append(["", "", "", "TOTAL", f"RS {subTotal}"])

    # Table Styling
    table = Table(data, colWidths=[50, 200, 50, 70, 70, 100])
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])
    table.setStyle(style)

    # Draw Table
    table.wrapOn(c, width, height)
    table.drawOn(c, 30, height - 600)  # Adjust starting position of the table to prevent overlap

    # Comments Section
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 620, "Other Comments or Special Instructions:")
    for i in range(4):
        c.drawString(30, height - 640 - (i * 15), f"{i + 1}. ___________________________________________")

    # Footer Section
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(30, 30, "Thank you for your business!")

    # # Save the PDF
    c.save()
    print(f"Invoice '{file_name}' generated successfully.")


@eel.expose
def add_new_product_record(formData, season):
    today = date.today()

    collection = 'winterCollection' if season == 'winter_stock' else 'summerCollection'
    create_table = create_winter_table if season == 'winter_stock' else create_summer_table

    select_query = f"SELECT remaining_stock FROM {season} WHERE product_desc = ? ORDER BY product_id DESC"
    previous_data = db.fetch_data(select_query, (formData[collection],), limit=1)
    print(f"previous_data: {previous_data[0][0]}")
    if len(previous_data) > 0:
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
def get_client_record(telephone):
    print(telephone)
    try:
        select_query = f"""
        SELECT bill_number, created_at, bill_path
        FROM client_history
        WHERE bill_number = ?
        ORDER BY client_id DESC
        """
        results = db.fetch_data(select_query, (telephone,))
        print(results)
        return results

    except Exception as e:
        print(f'Database error: {e}')
        return []
        


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