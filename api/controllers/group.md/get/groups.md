**Get groups list**
----
  Returns json data of a groups list.

* **URL**

  /groups

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
   `library=[string]` Return only groups related to this library ID or identifier<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, total: 550, data: { ... } }`
