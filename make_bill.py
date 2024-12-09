from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


def create_invoice(file_name):
    # Create the PDF canvas
    c = canvas.Canvas(file_name, pagesize=letter)
    width, height = letter

    # Header Section
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.green)
    c.drawString(200, height - 50, "HUSNAIN APPARELS")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawString(200, height - 70, "All Jaddah market Dr. Plaza Main Satayana Road Faisalabad")
    c.drawString(200, height - 85, "City: Faisalabad, Phone: +92 303 9856472")
    c.drawString(200, height - 100, "Email: husnain@apparels.com")
    c.line(30, height - 110, width - 30, height - 110)

    # Invoice Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height - 140, "BILL TO:")
    c.drawString(300, height - 140, "SHIP TO:")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 160, "Name: ____________________________")
    c.drawString(300, height - 160, "Name: ____________________________")
    c.drawString(30, height - 175, "Phone: ____________________________")
    c.drawString(300, height - 175, "City: ____________________________")

    # Invoice Metadata
    c.drawString(30, height - 200, "INVOICE #: ___________________")
    c.drawString(200, height - 200, "DATE: ___________________")
    # c.drawString(400, height - 200, "CUSTOMER ID: ___________________")

    # Table Header and Blank Data Rows
    data = [
        ["ITEM #", "DESCRIPTION", "QTY", "UNIT PRICE", "TAX", "TOTAL"],
    ]

    # Add empty rows (14 total) for blank fields
    for i in range(14):
        data.append([str(i + 1), "", "", "", "", ""])

    # Add Subtotal and Total rows
    data.append(["", "", "", "", "SUBTOTAL", ""])
    data.append(["", "", "", "", "TOTAL", ""])

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

    # Save the PDF
    c.save()
    print(f"Invoice '{file_name}' generated successfully.")


# Generate the invoice
create_invoice("invoice_with_blank_fields.pdf")
