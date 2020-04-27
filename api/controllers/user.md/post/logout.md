**Logout User Account**
----
  Returns json data token when user logout.

* **URL**

  /logout

* **Method:**

  `POST`

*  **Headers Params**

   **Required:**

   `Content-Type=application/x-www-form-urlencoded` <br />
   `x-access-token=[string]`

* **Success Response:**

  * **Code:** 204 No Content


* **Error Response:**

  * **Code:** 401 Unauthorized <br />
    **Reason:** Not loggued
