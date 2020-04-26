**Create new library**
----
  Returns json data when creating a library.

* **URL**

  /admin/library/add

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`<br />
   `x-access-token=[string]`

*  **Data Params**

   **Required:**

   `id=[string]` Unique identifier for this library<br />

   **Optionnal:**

   `fullScanDelay=[integer]` Delay between 2 fullscan tasks, in minutes<br />
   `active=[bool]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ...library data... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad or already existing ID parameter

  OR
  * **Code:** 500 Internal Server Error <br />
    **Reason:** Can't create directory or forbidden method
