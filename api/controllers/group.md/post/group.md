**Create new user group**
----
  Returns json data when creating a user group.

* **URL**

  /admin/group/add

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`<br />
   `x-access-token=[string]`

*  **Data Params**

   **Required:**

   `name=[string]`<br />
   `library=[string]` ID of related library<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Wrong parameters or forbidden access
