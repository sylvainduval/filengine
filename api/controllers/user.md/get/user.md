**Get user account**
----
  Returns json data of a user account.

* **URL**

  /user/:id

* **Method:**

  `GET`

*  **Headers Params**

   **Required:**

   `x-access-token=[string]`

*  **Route Params**

   **Required:**

   `id=[string]`<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ...user data... } }`


* **Error Response:**

  * **Code:** 500 Internal Server Error <br />
    **Reason:** Invalid user ID
