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

*  **Route Params**

   **Required:**

   `id=[string]`<br />

*  **Data Params**

   **Optionnal:**

   `name=[string]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad group ID parameter or forbidden access
