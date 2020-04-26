**Login User Account**
----
  Returns json data token when user login.

* **URL**

  /login

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`

*  **Data Params**

   **Required:**

   `login=[string]`<br />
   `password=[string]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Wrong parameters

  OR
  * **Code:** 401 Unauthorized <br />
    **Reason:** Bad password

  OR
  * **Code:** 500 Internal Server Error <br />
    **Reason:** User account not found
