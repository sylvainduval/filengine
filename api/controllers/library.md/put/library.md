**Save library settings**
----
  Send data for editing library properties.

* **URL**

  /admin/library/:id

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

   `fullScanDelay=[integer]` Delay between 2 fullscan tasks, in minutes<br />
   `active=[bool]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ...library data... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad library ID parameter or forbidden access
