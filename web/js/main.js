
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
        billItems+=1;
        if (billItems >= 14) {
            addItem.style.display = 'none';
        }
    });
    
}


//Bill generator
const form = document.querySelector('#generate-bill');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
    
        // Collect form data using FormData
        const formData = new FormData(form);
        const dataObject = {};
    
        formData.forEach((value, key) => {
            // If the key already exists, push the value into an array
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
    
        formData.forEach((value, key) => {
            dataObject[key] = value;
        });
    
        // Log the dictionary to check the structure
        console.log(dataObject);
    
        
        // Send data to the Python function via Eel
        await eel.add_new_product_record(dataObject);
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
            document.getElementById('winter-collection').style.display = 'none';
            document.getElementById('show-table').style.display = 'block';
            const productDesc = this.getAttribute('data-product-id');
            console.log(productDesc)

            const records = await eel.get_product_records(productDesc)();

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


// Show product record
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
