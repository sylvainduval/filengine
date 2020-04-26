**Upload a file**
----
  Post file data and get a rescan task for target directory.

* **URL**

  /:libraryId/upload/:directoryId

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=multipart/form-data`<br />
   `x-access-token=[string]`

*  **URL Params**

   **Required:**

   `libraryId=[string]`<br />
   `directoryId=[string]`<br />

* **Success Response:**

  * **Code:** 201 <br />
    **Content:** `{ success: true, data: { ...rescan task ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** File not supplied

  * **Code:** 500 Internal Server Error <br />
    **Reasons:** Bad directory ID, Can't write scan task, Unable to copy to directory path
