**Register User Account**
----
  Returns json data when registering a user.

* **URL**

  /register

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`

   **Optionnal:**

   `x-access-token=[string]` If current user is loggued as admin, create another user account using this method

*  **Data Params**

   **Required:**

   `login=[string]`<br />
   `email=[string]`<br />
   `password=[string]`<br />

   **Optionnal:**

   `libraries=[object]` JSON list of libraries IDs available for user. If not set, an administrator must assign it after account created in order to use app. Example: [1234,5678]

* **Success Response:**

  * **Code:** 201 <br />
    **Content:** `{ success: true, data: { ...user data... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Wrong parameters

  OR
  * **Code:** 403 Forbidden <br />
    **Reason:** User login already used

  OR
  * **Code:** 500 Internal Server Error <br />
    **Reason:** Can't write in database
