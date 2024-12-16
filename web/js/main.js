
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


// Show error alert
function showAlert(errorMessage) {
    let elem = document.querySelector('.alert');
    elem.innerHTML = errorMessage;
    elem.style.display = 'block';
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
        

        if (!/^\d{11}$/.test(billNumber)) {
            showAlert('Invalid phone number! Correct format is 03#########');
            return;
        }

        if (Array.isArray(dataObject['item-qty'])) {
                for (i=0; i<dataObject['item-qty'].length; i++) {
                    const itemQty = Number(dataObject['item-qty'][i]);
                    const itemPrice = Number(dataObject['item-price'][i]);
                
                    if (!Number.isInteger(itemQty) || itemQty < 0) {
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
        
            if (!Number.isInteger(itemQty) || itemQty < 0) {
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
        await eel.create_bill(dataObject);
        alert('Invoice created!');
        location.reload();
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
            alert('Both "stock-inflow" and "stock-outflow" cannot be empty!');
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
        alert('Record added!')
    
        location.reload();
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


// Show client record
const searchPhone = document.querySelector('#search-client-history');
const searchBox = document.querySelector('#search-bar');
if (searchPhone && searchBox) {
    console.log('its working');
    searchPhone.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const records = await eel.get_client_record(searchBox.value)();

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
    });
}
