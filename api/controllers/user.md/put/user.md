**Modify user account**
----
  Send data for editing user account.

* **URL**

  /user/:id

* **Method:**

  `PUT`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded`<br />
   `x-access-token=[string]`

*  **URL Params**

   **Required:**

   `id=[string]` User ID<br />

* **Data Params**

   **Optionnal:**

   `libraries=[object]` JSON list of libraries IDs available for user. Example: [1234,5678] <br />
   `email=[string]` <br />
   `password=[string]`<br />
   `isAdmin=[integer]` `0` or `1` <br />
   `isContributor=[integer]` `0` or `1`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, data: { ...user data... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad ID parameter

  OR
  * **Code:** 403 Forbidden <br />
    **Reason:** Method not allowed for current user or libraries list not allowed
