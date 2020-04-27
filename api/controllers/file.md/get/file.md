**Get file informations**
----
  Returns json data containing informations about a file.

* **URL**

  /:libraryId/file/:fileId

* **Method:**

  `GET`

*  **Headers Params**

   **Required:**

   `x-access-token=[string]`

*  **Route Params**

   **Required:**

   `libraryId=[string]`<br />
   `fileId=[string]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reasons:** File not found or forbidden access
