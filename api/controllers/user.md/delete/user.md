**Delete user account**
----
  Request for deleting a user account.

* **URL**

  /user/:id

* **Method:**

  `DELETE`

*  **Headers Params**

   **Required:**

   `x-access-token=[string]`

*  **Route Params**

   **Required:**

   `id=[string]` User ID<br />

* **Success Response:**

  * **Code:** 204 <br />
    **Content:** `{ success: true }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad ID parameter

  OR
  * **Code:** 403 Forbidden <br />
    **Reason:** Method not allowed for current user
