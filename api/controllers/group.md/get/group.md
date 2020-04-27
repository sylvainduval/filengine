**Get user group informations**
----
  Returns json data of user group informations.

* **URL**

  /admin/group/:id

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
    **Content:** `{ success: true, data: { ... } }`


* **Error Response:**

  * **Code:** 400 Bad Request <br />
    **Reason:** Bad group ID
