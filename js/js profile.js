// Load jQuery if it's not already loaded
if (typeof jQuery === 'undefined') {
    var script = document.createElement('script');
    script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    script.onload = function () {

        // Ensure the DOM is ready and only then bind the button click event
        $(document).ready(function () {
            initializePage();
        });
    };
    script.onerror = function () {
        console.error("Failed to load jQuery.");
    };
    document.head.appendChild(script);
} else {

    // If jQuery is already loaded, bind the click event immediately
    $(document).ready(function () {
        initializePage();
    });
}
/**
* دالة لإظهار السبينر
*/
function showSpinner() {
    $("#spinner").show();
}

/**
* دالة لإخفاء السبينر
*/
function hideSpinner() {
    $("#spinner").hide();
}

// Updated Function to initialize the page
async function initializePage() {
    addEventListeners();    // Add event listener for Save button
    addInstructions();      // Add instructions to the screen
    createDataTable();      // Create the table to display data

    // Check if registration number exists in session storage
    var registration_Number = sessionStorage.getItem('registrationNumber');
    if (registration_Number) {
        await fetchClientCredentials(); // Await fetch and display existing credentials
    } else {
    }
}

// Function to add event listeners
function addEventListeners() {
    // مستمع حدث للنقر على زر الحفظ
    $('.saveButton').on('click', saveClientCredentials);
    
    // مستمع حدث للضغط على مفتاح داخل حقول الإدخال
    $('input').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // منع السلوك الافتراضي إذا كان داخل نموذج
            $('.saveButton').click(); // تفعيل الزر
        }
    });
}

// Function to handle the save button click event
function saveClientCredentials() {
    // Remove focus (blur) from the saveButton
    $('.saveButton').blur();

    // Retrieve input values from the form
    var registration_Number = $('.input1').val().trim();
    var clientid = $('.input2').val().trim();
    var client_secret = $('.input3').val().trim();

    // Retrieve userId from session storage
    var userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
    }

    // Log captured values to console for debugging


    // Call the API and handle success or error responses
    uploadClientCredentials(registration_Number, clientid, client_secret, userId)
        .then(function (result) {
            if (result && result.success) {
               // عرض النافذة الناجحة
                showSuccessModal();
                           
                // Update table with the new data
                updateDataTable(registration_Number, clientid, client_secret);
            } else if (result && !result.success) {
                alert("Error: " + result.message);  // Show error alert
            }
        })
        .catch(function (error) {
            alert("Unexpected error: " + error.message);  // Handle unexpected errors
        })
        .finally(function () {
            clearInputFields();  // Clear input fields after submission
        });
}


// Function to add CSS styles for the table
function addTableStyles() {
    var style = `
        .credentials-table {
            width: 100%;
            margin-left: 700px;
            border-collapse: collapse;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border: 2px solid #000;
            border-radius: 20px;
        }

        .credentials-table th,
        .credentials-table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            text-align: center;
        }

        .credentials-table th {
            background-color: #007BFF;
            color: #fff;
            font-weight: bold;
            
        }

        .credentials-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

       

        .credentials-table td {
            color: #000;
        }
    `;

    // Create a style element and append it to the head
    var styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = style;
    document.head.appendChild(styleSheet);
   
       

}

// Function to create a table to display the credentials
function createDataTable() {
    // Check if table already exists
    if ($('#dataTable').length > 0) {
        return; // Prevent adding the table again
    }

    // Create table structure
    var table = `
        <table id="dataTable" class="credentials-table">
            <thead>
                <tr>
                    <th>Registration Number</th>
                    <th>Client ID</th>
                    <th>Client Secret</th>
                </tr>
            </thead>
            <tbody>
                <!-- Data rows will be added here -->
            </tbody>
        </table>
    `;

    // Append the table after the form container
    $('.form-container').after(table);
}

// Function to update the table with new data
function updateDataTable(registration_Number, clientid, client_secret) {
    // Clear existing table data
    $('#dataTable tbody').empty();

    // Add new data as a row in the table
    var newRow = `
        <tr>
            <td>${registration_Number}</td>
            <td>${clientid}</td>
            <td>${client_secret}</td>
        </tr>
    `;

    $('#dataTable tbody').append(newRow);
}
// Function to validate inputs using regex and check for empty values
function validateInputs(registration_Number, clientid, client_secret) {
    var minLength = 3;
    var regexPattern = '^[a-zA-Z0-9]{' + minLength + ',}$';
    var registrationRegex = new RegExp(regexPattern);
    var clientidRegex = new RegExp(regexPattern);
    var clientSecretRegex = new RegExp(regexPattern);

    // Check if registration number is empty or doesn't match the regex
    if (!registration_Number || !registration_Number.match(registrationRegex)) {
        return { valid: false, message: 'Invalid Registration Number. It must be at least ' + minLength + ' alphanumeric characters.' };
    }

    // Check if client ID is empty or doesn't match the regex
    if (!clientid || !clientid.match(clientidRegex)) {
        return { valid: false, message: 'Invalid Client ID. It must be at least ' + minLength + ' alphanumeric characters.' };
    }

    // Check if client secret is empty or doesn't match the regex
    if (!client_secret || !client_secret.match(clientSecretRegex)) {
        return { valid: false, message: 'Invalid Client Secret. It must be at least ' + minLength + ' alphanumeric characters.' };
    }

    // If all fields are valid
    return { valid: true };
}
// Function to upload client credentials to the API
async function uploadClientCredentials(registration_number, client_id, client_secret, userId) {
    showSpinner();
    var payload = {
        registration_number: registration_number,
        clientid: client_id,
        client_secret: client_secret,
        user_id: userId
    };

    var apiUrl = 'https://ai5un58stf.execute-api.us-east-1.amazonaws.com/PROD/MFCC';

    try {
        var response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            var data = await response.json();
            alert("Success: " + data.body);
            return { success: true, message: data.body };
        } else {
            var errorData = await response.json();
            var errorMessage = errorData.message || 'Status code ' + response.status;
            alert("Error: " + errorMessage);
            return { success: false, message: errorMessage };
        }
    } catch (error) {
        console.error("Error during API request:", error);
        alert("Error: " + error.message);
        return { success: false, message: error.message };
    } finally {
        hideSpinner();
        
    }
}


// Updated Function: Fetch client credentials upon script initialization
async function fetchClientCredentials() {
    showSpinner();
    // Retrieve registrationNumber from session storage
    var registrationNumber = sessionStorage.getItem('registrationNumber');
    if (!registrationNumber) {
        console.warn("Registration number not found in session storage. Skipping fetch.");
        return;
    }

    // Prepare payload (using the same payload structure as upload)
    var payload = {
        registration_number: registrationNumber,
    };

    var apiUrl = 'https://ai5un58stf.execute-api.us-east-1.amazonaws.com/PROD/MFCC'; // Same API URL

    try {

        var response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });


        if (response.ok) {
            // Parse the response to JSON
            var data = await response.json();

            // Since the response body is double encoded, parse it again
            if (data.body) {
                data = JSON.parse(data.body);  // Parse the stringified JSON body

            }

            // Check if data exists and contains credentials
            if (data && data.credentials && Array.isArray(data.credentials)) {
                data.credentials.forEach(function(credential) {
                    // Destructure credential object
                    var { registration_number, clientid, client_secret } = credential;

                    // Append each credential to the table
                    var newRow = `
                        <tr>
                            <td>${registration_number}</td>
                            <td>${clientid}</td>
                            <td>${client_secret}</td>
                        </tr>
                    `;
                    $('#dataTable tbody').append(newRow);
                });

            } else {
            }
        } else {
            console.error("Failed to fetch credentials. Status Code:", response.status);
            var errorData = await response.json();
            console.error("Error response:", errorData);
        }
    } catch (error) {
        console.error("Error during fetchClientCredentials:", error);
    } finally {
        hideSpinner();
    }
}




// Function to clear input fields after submission
function clearInputFields() {
    $('.input1').val('');  // Clear registration number input
    $('.input2').val('');  // Clear client id input
    $('.input3').val('');  // Clear client secret input
}

// Function to add the instructions in both Arabic and English
function addInstructions() {
    var centerBox = $('.form-container');  // Assuming this is the container for the form

    if ($('.instruction-container').length > 0) {
        return; // Prevent adding instructions again
    }

    // Create container for English instructions
    var englishContainer = $('<div></div>').addClass('instruction-container-english-instructions');

    // English text content
    englishContainer.html(`
        <p>Page Guide</p>
        <p>This page is dedicated to importing invoices directly from the Electronic Invoice Portal, </p>
        <p> helping you easily prepare the company's VAT declarations with the added feature of alerts in case of any invoice errors. All you need to enter is:</p>
        <p>1-The company's tax registration number.</p>
        <p>2-ERP system credentials (Client ID and Client Secret).</p>
       
    `);
    

    // Create container for Arabic instructions
    var arabicContainer = $('<div></div>').addClass('instruction-container-arabic-instructions');

    // Arabic text content
    arabicContainer.html(`
        <p>دليل الصفحة</p>
        <p>في هذه الصفحة، مخصصة لاستيراد الفواتير مباشرتاً من موقع الفاتورة الإلكترونية، مما يساعدك في </p>
        <p>:عداد إقرارات القيمة المضافة للشركة بكل سهولة مع ميزة و جود تنبيهات إذا وجد اي خطأ في الفاتورة. كل ما تحتاج إلى إدخاله هو</p>
        <p>.رقم التسجيل الضريبي الخاص بالشركة</p>
        <p>ERPبيانات نظام الـ </p>
        <p>.(معرّف العميل Client ID و Client Secret  المفتاح السري)</p>
    `);

    // Insert both containers into the DOM positioned near the central box
    englishContainer.insertBefore(centerBox);  // Insert English text before the center box
    
    arabicContainer.insertBefore(centerBox);    // Append Arabic text after the center box
}


/**
 * عرض نافذة النجاح بعد حذف الحساب
 */
function showSuccessModal() {
    // إزالة أي نافذة منبثقة حالية
    const existingModal = document.getElementById("successModal");
    if (existingModal) {
      existingModal.remove();
    }
  
    // إنشاء طبقة تغطية النافذة المنبثقة
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "successModal";
    modalOverlay.style.position = "fixed";
    modalOverlay.style.top = "0";
    modalOverlay.style.left = "0";
    modalOverlay.style.width = "100%";
    modalOverlay.style.height = "100%";
    modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    modalOverlay.style.display = "flex";
    modalOverlay.style.alignItems = "center";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.style.zIndex = "1000";
  
    // إنشاء محتوى النافذة المنبثقة
    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "#fff";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "20px";
    modalContent.style.textAlign = "center";
    modalContent.style.maxWidth = "350px";
    modalContent.style.width = "80%";
    modalContent.style.border = "rgb(131, 155, 218) 16px solid";
  
    // إنشاء أيقونة العلامة الخضراء
    const checkmark = document.createElement("div");
    checkmark.innerHTML = "&#10004;"; // Unicode for checkmark
    checkmark.style.fontSize = "50px";
    checkmark.style.color = "#28a745"; // green color
    checkmark.style.marginBottom = "20px";
  
    // إنشاء الرسالة
    const messagePara = document.createElement("p");
    messagePara.innerHTML = ".تم حفظ بيناتك بنجاح<br>لكي تحصل علي جميع بياناتك بشكل كامل يرجى الانتظار بين 3 إلى 5 ساعات من الآن";
    messagePara.style.fontSize="18px";
    messagePara.style.fontWeight="bold";
  
    // إنشاء زر OK
    const okButton = document.createElement("button");
    okButton.textContent = "موافق";
    okButton.id = "okButton";
    okButton.style.marginTop = "20px";
    okButton.style.padding = "10px 20px";
    okButton.style.border = "none";
    okButton.style.backgroundColor = "#5581ed"; // primary color
    okButton.style.color = "#fff";
    okButton.style.borderRadius = "5px";
    okButton.style.cursor = "pointer";
    okButton.style.fontSize = "14px";
    okButton.style.fontWeight = "bold";
    okButton.style.transition="0.3s";

    okButton.addEventListener("mouseover", function () {
      okButton.style.backgroundColor = "rgb(50, 77, 145)"; // تغيير لون الخلفية عند التمرير
      okButton.style.color = "white"; // تغيير لون النص عند التمرير
      okButton.style.transform = "scale(1.05)"; // تأثير تكبير خفيف
      okButton.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.5)"; // إضافة ظل
    });
  
    okButton.addEventListener("mouseout", function () {
      okButton.style.backgroundColor = "#5581ed"; // اللون الأصلي
      okButton.style.color = "#fff"; // اللون الأصلي للنص
      okButton.style.transform = "scale(1)"; // إعادة الحجم الأصلي
      okButton.style.boxShadow = "none"; // إزالة الظل
    });
  
    // إضافة العناصر إلى محتوى النافذة المنبثقة
    modalContent.appendChild(checkmark);
    modalContent.appendChild(messagePara);
    modalContent.appendChild(okButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
  
    // إضافة مستمع للزر OK
    okButton.addEventListener("click", function () {
      // مسح sessionStorage
      window.location.href = 'home.html';
      
    });
  
    // إضافة مستمع للزر OK
    modalOverlay.addEventListener("click", function () {
     
      window.location.href = 'home.html';
      
    });
  }


// Function to clear session storage and log out the user
function logOutAndClearSession() {
    // Clear all items in session storage
    sessionStorage.clear();

    // Redirect to the login page
   window.location.href = "https://us-east-1fhfklvrxm.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=6fj5ma49n4cc1b033qiqsblc2v&redirect_uri=https://mohasibfriend.github.io/Mohasib-Friend/";
}

// Get the existing logout button by its ID
const logoutButton = document.getElementById("logoutbutton");

// Add click event to the existing button
if (logoutButton) {
 logoutButton.addEventListener("click", logOutAndClearSession);
}

function showInfo() {
    document.getElementById("infoModal").style.display = "block";
  }
  
  function closeModal() {
    document.getElementById("infoModal").style.display = "none";
  }
  
  // Close the modal when clicking outside the content
  window.onclick = function(event) {
    if (event.target == document.getElementById("infoModal")) {
        closeModal();
    }
  }
// إضافة مستمع حدث للضغط على مفتاح
window.addEventListener('keydown', function(event) {
    // التحقق مما إذا كان المفتاح المضغوط هو Esc
    if (event.key === 'Escape' || event.key === 'Esc') {
        closeModal();
    }
});