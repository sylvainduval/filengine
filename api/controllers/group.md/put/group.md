**Save user group settings**
----
  Send data for editing user group properties.

* **URL**

  /admin/group/:id

* **Method:**

  `PUT`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`<br />
   `x-access-token=[string]`

*  **URL Params**

   **Required:**

   `id=[string]`<br />

*  **Data Params**

   **Optionnal:**

   `name=[string]`<br />
   `dirs=[object]` JSON object of root directories for the group. Example: `["5aef10be613fc835dd6daf3f", "5af17092b732c30edca0dad4"]`
Send an empty table to clear `[]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad group ID parameter or forbidden access
