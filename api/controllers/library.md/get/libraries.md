**Get library list**
----
  Returns json data of a libraries list.

* **URL**

  /libraries

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
   `inactive=[bool]` If true, inactive libraries will be returned too<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ success: true, total: 550, data: { ... } }`
