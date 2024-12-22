
const items = {
    summer : [
        {value: "fabric-soft-cotton", text: "Fabric soft cotton"},
        {value: "cutting-charges", text: "Cutting charges"},
        {value: "embroidery", text: "Embroidery"},
        {value: "stiching", text: "Stiching"},
        {value: "bukram", text: "Bukram"},
        {value: "overlock", text: "Overlock"},
        {value: "button", text: "Button"},
        {value: "thread", text: "Thread"},
        {value: "ress-labour", text: "Ress labour"},
        {value: "kollar", text: "Kollar patti + gatta"},
        {value: "clips", text: "Clips"},
        {value: "packing-bags", text: "Packing bags"},
        {value: "shalwar-stiching", text: "Shalwar stiching"}
    ],

    winter : [
        {value: "fabric-parachute", text: "Fabric parachute"}, 
        {value: "warding-polyester", text: "Warding polyester"}, 
        {value: "aster-fabric", text: "Aster fabric"},
        {value: "cutting-charges", text: "Cutting charges"},
        {value: "labour", text: "Labour"},
        {value: "overlock", text: "Overlock"},
        {value: "ilets", text: "Ilets"},
        {value: "Embroidery", text: "Embroidery"},
        {value: "zips", text: "Zips"},
        {value: "thread", text: "Thread"},
        {value: "dori", text: "Dori"},
        {value: "pollar", text: "Pollar"},
        {value: "packing-bags", text: "Packing bags"},
        {value: "rib", text: "Rib"} 
    ]
}

const radioSummer  = document.getElementById('summer');
const radioWinter = document.getElementById('winter');
const addItem = document.querySelector('#add-item');
const itemList = document.querySelector('#items');
let billItems = 1;



function showAlert(message, type = 'danger', autoHide = false, duration = 5000, defaultElem = 0) {
    let elem = document.querySelectorAll('.alert')[defaultElem];
    if (!elem) return; // Exit if no alert element is found

    // Reset alert classes
    elem.className = `alert alert-${type}`; // Overwrite className for clean slate

    // Set the message
    elem.innerHTML = message;

    // Display the alert
    elem.style.display = 'block';

    // Auto-hide logic
    if (autoHide) {
        setTimeout(() => {
            elem.style.display = 'none';
        }, duration);
    }
}



// Check phone number validity
function checkNumberValidity(number) {
    if (!/^\d{11}$/.test(number)) {
        return false;
    }
    return true;
}

//Add item
if(addItem) {
    addItem.addEventListener("click", (e) => {
        e.preventDefault();
    
        const newItem = document.createElement('div');
        newItem.classList.add('row');
        newItem.classList.add('mt-3');
    
        newItem.innerHTML = `
            <div class="col">
                <input type="text" placeholder="item description.." class="form-control" name="item-description">
            </div>
            <div class="col">
                <input type="text" placeholder="qty.." class="form-control" name="item-qty">
            </div>
            <div class="col">
                <input type="text" placeholder="unit price.." class="form-control" name="item-price">
            </div>
            
        `;
        itemList.appendChild(newItem);
        // billItems+=1;
        // if (billItems >= 14) {
        //     addItem.style.display = 'none';
        // }
    });
    
}


// Check valid number
function isNotValidNumber(value) {
    return !(typeof value === 'number' && !isNaN(value) && Number.isFinite(value) && !Number.isInteger(value));
}

//Bill generator
const form = document.querySelector('#generate-bill');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
    
        // Collect form data using FormData
        const formData = new FormData(form);
        const dataObject = {};
        let hasEmptyFields = false;
    
        formData.forEach((value, key) => {
            // If the key already exists, push the value into an array
            if (value.trim() == "") {
                hasEmptyFields = true;
            }
            if (dataObject[key]) {
                if (Array.isArray(dataObject[key])) {
                    dataObject[key].push(value);
                } else {
                    dataObject[key] = [dataObject[key], value];
                }
            } else {
                // Otherwise, just set the value
                dataObject[key] = value;
            }
        });

        if (hasEmptyFields) {
            showAlert('Cannot leave empty fields!');
            return;
        }

        const billNumber = dataObject['bill-number'];
        

        if (!checkNumberValidity(billNumber)) {
            showAlert('Invalid phone number! Correct format is 03#########');
            return;
        }

        if (Array.isArray(dataObject['item-qty'])) {
                for (i=0; i<dataObject['item-qty'].length; i++) {
                    const itemQty = Number(dataObject['item-qty'][i]);
                    const itemPrice = Number(dataObject['item-price'][i]);
                
                    if (!Number.isInteger(itemQty) || itemQty < 0 || dataObject['item-qty'][i].includes('.')) {
                        showAlert('Invalid value for quantity! Can only be a positive integer');
                        return;
                    }

                    if (!Number.isFinite(itemPrice) || itemPrice < 0) {
                        showAlert('Invalid value for price!');
                        return;
                    }
                }
        } else {
            const itemQty = Number(dataObject['item-qty']);
            const itemPrice = Number(dataObject['item-price']);
        
            if (!Number.isInteger(itemQty) || itemQty < 0 || dataObject['item-qty'].includes('.')) {
                showAlert('Invalid value for quantity! Can only be a positive integer');
                return;
            }

            if (!Number.isFinite(itemPrice) || itemPrice < 0) {
                showAlert('Invalid value for price!');
                return;
            }
        }

        // Log the dictionary to check the structure
        console.log(dataObject);
    
        // Send data to the Python function via Eel
        await eel.create_bill(dataObject)().then(response => {
            if (response === 1) {
                showAlert('Invoice created!', type='success');
            }
            else {
                console.log(response);
                showAlert('There was some error while processing the inputs! Please make sure all inputs are correct');
                return;
            }
        });

    });
    
}

//New product record
const product_form = document.querySelector('#new-record-form');
if (product_form) {
    product_form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        // Collect form data using FormData
        const formData = new FormData(product_form);
        const dataObject = {};
        const target = e.target;
        const collectionValue = target.getAttribute('data-collection');
        console.log(collectionValue)
    
        formData.forEach((value, key) => {
            value = value.trim();
            dataObject[key] = value;
        });

        // Check if None selected
        let itemSelected = dataObject['winterCollection'] || dataObject['summerCollection'];

        if (!itemSelected) {
            showAlert('No item selected! Please select an item');
            return;
        }

        // Extract and validate stock fields
        let stockInflow = dataObject['stock-inflow'] || null;
        let stockOutflow = dataObject['stock-outflow'] || null;

        // Ensure fields are integers
        if (stockInflow && !Number.isInteger(Number(stockInflow))) {
            showAlert('Stock inflow must be an integer!');
            return;
        }
        if (stockOutflow && !Number.isInteger(Number(stockOutflow))) {
            showAlert('Stock outflow must be an integer!');
            return;
        }

        // Check if both fields are empty
        if (!stockInflow && !stockOutflow) {
            showAlert('Both "Stock inflow" and "Stock outflow" cannot be empty!');
            return;
        }

        // Assign default value of 0 if one of the fields is empty
        dataObject['stock-inflow'] = stockInflow ? Number(stockInflow) : 0;
        dataObject['stock-outflow'] = stockOutflow ? Number(stockOutflow) : 0;
    
        // Log the dictionary to check the structure
        console.log(dataObject);
    
        
        // Send data to the Python function via Eel
        if (collectionValue === 'winter') {
            await eel.add_new_product_record(dataObject, "winter_stock");
        } else if (collectionValue === 'summer') {
            await eel.add_new_product_record(dataObject, "summer_stock");
        }
        showAlert('Record added!', type = 'success');
    
    });
}


// Manage balance
const balance_form = document.querySelector('#balance-form');
if (balance_form) {
    balance_form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        // Collect form data using FormData
        const formData = new FormData(balance_form);
        const dataObject = {};
    
        formData.forEach((value, key) => {
            value = value.trim();
            dataObject[key] = value;
        });

        // Check if None selected
        const telephone = dataObject['telephone'];

        if (!checkNumberValidity(telephone)) {
            showAlert('Invalid phone number! Correct format is 03#########', 'danger', false, 5000, defaultElem = 1);
            return;
        }

        // Extract and validate stock fields
        let credit = dataObject['credit'] || null;
        let debit = dataObject['debit'] || null;

        // Ensure fields are integers
        if (credit && !Number.isInteger(Number(credit))) {
            showAlert('Credit must be an integer!', 'danger', false, 5000, defaultElem = 1);
            return;
        }
        if (debit && !Number.isInteger(Number(debit))) {
            showAlert('Credit must be an integer!', 'danger', false, 5000, defaultElem = 1);
            return; 
        }

        // Check if both fields are empty
        if (!credit && !debit) {
            showAlert('Credit must be an integer!', 'danger', false, 5000, defaultElem = 1);
            return;
        }

        // Assign default value of 0 if one of the fields is empty
        dataObject['credit'] = credit ? Number(credit) : 0;
        dataObject['debit'] = debit ? Number(debit) : 0;
    
        // Log the dictionary to check the structure
        console.log(dataObject);
    
        
        // Send data to the Python function via Eel
        await eel.manage_balance(dataObject);
        showAlert('Record added!', 'success', false, 5000, defaultElem = 1)
    
    });
}

//Show product record
const products = document.querySelectorAll('.product-link');
console.log(products);
if (products) {
    products.forEach(link => {
        console.log('its working');
        link.addEventListener('click', async function (e) {
            e.preventDefault();
            document.getElementById('stock-collection').style.display = 'none';
            document.getElementById('show-table').style.display = 'block';
            const productDesc = this.getAttribute('data-product-id');
            console.log(productDesc)

            const entriesCount = document.querySelector('.entries-count');
            const itemName = link.querySelector(`span`);

            const target = document.querySelector('#new-record-form');
            const collectionValue = target.getAttribute('data-collection');
            console.log(collectionValue)
            let records;


            if (collectionValue === 'winter') {
                records = await eel.get_product_records(productDesc, "winter_stock")();
            } else if (collectionValue === 'summer') {
                records = await eel.get_product_records(productDesc, "summer_stock")();
            }

            entriesCount.innerHTML = `<span class='text-primary'>[${records.length}]</span> Showing results for <span class='text-primary'>${itemName.innerHTML}</span>`;

            // Populate the table with fetched records
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = ''; // Clear previous records

            if (records.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4">No records found</td></tr>';
            } else {
                records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${record[0]}</td>
                        <td>${record[1]}</td>
                        <td>${record[2]}</td>
                        <td>${record[3]}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        })
    })
}

// Select type of record
const selectRecord = document.querySelector('#selectRecord');
if (selectRecord) {
    selectRecord.addEventListener('change', function () {
        const selectedValue = this.value;
      
        // Get table elements
        const invoiceTable = document.getElementById('clients-table');
        const balanceTable = document.getElementById('balance-table');
      
        // Show or hide tables based on selection
        if (selectedValue === 'invoice-record') {
          invoiceTable.style.display = 'table'; // Show invoice table
          balanceTable.style.display = 'none'; // Hide balance table
        } else if (selectedValue === 'balance-record') {
          balanceTable.style.display = 'table'; // Show balance table
          invoiceTable.style.display = 'none'; // Hide invoice table
        }
    });
}

// Show client record
const searchPhone = document.querySelector('#search-client-history');
const searchBox = document.querySelector('#search-bar');
if (searchPhone && searchBox) {
    console.log('its working');
    searchPhone.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!checkNumberValidity(searchBox.value)) {
            showAlert('Invalid phone number! Correct format is 03#########');
            return;
        }
        
        const records = await eel.get_client_record(searchBox.value, 'invoice')();
        const balance_records = await eel.get_client_record(searchBox.value, 'balance')();

        // Populate the table with fetched records
        const tableBody = document.getElementById('tableBody');
        const balanceTableBody = document.getElementById('balanceTableBody');
        tableBody.innerHTML = ''; // Clear previous records
        balanceTableBody.innerHTML = '';

        if (records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No records found</td></tr>';
        } else {
            records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record[0]}</td>
                    <td>${record[1]}</td>
                    <td><a href="#" class="invoice">${record[2]}</a></td>
                `;
                tableBody.appendChild(row);
            });

            // Add event listener to dynamically created invoice links
            const invoices = document.querySelectorAll('.invoice');
            invoices.forEach(bill => {
                bill.addEventListener('click', function (e) {
                    console.log('click');
                    e.preventDefault(); // Prevent default behavior if it's a link
                    
                    // Get the text content as the file name or use a data attribute if needed
                    const fileName = this.textContent.trim(); // Assuming the file name is the text content
                    
                    // Call the Python function to open the file
                    eel.open_file(fileName)()
                        .then(() => console.log(`Requested to open file: ${fileName}`))
                        .catch(err => console.error('Error opening file:', err));
                });
            });
        }

        if (balance_records.length === 0) {
            balanceTableBody.innerHTML = '<tr><td colspan="6">No records found</td></tr>';
        } else {
            balance_records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record[0]}</td>
                    <td>${record[1]}</td>
                    <td>${record[2]}</td>
                    <td>${record[3]}</td>
                    <td>${record[4]}</td>

                `;
                balanceTableBody.appendChild(row);
            });
        }
    });
}
