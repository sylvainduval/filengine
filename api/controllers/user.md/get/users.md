**Get user list**
----
  Returns json data of a users list.

* **URL**

  /users

* **Method:**

  `GET`

*  **Headers Params**

   **Required:**

   `x-access-token=[string]`

*  **URL Params**

   **Optionnal:**

   `search=[string]` Search expression<br />
   `offset=[integer]` Return results after<br />
   `limit=[integer]` Maximum results number<br />
   `library=[string]` Return only users accessing this library ID<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, total: 550, data: { ... } }`
