
const BASE_URL = "http://localhost:8080/api/v1"
// const BASE_URL = "https://api.valiproduce.shop/api/v1"



export const endpoints = {
  LOGIN_API: BASE_URL + "/auth/login",
  SIGNUP_API: BASE_URL + "/auth/register",
  GET_USER_API: BASE_URL + "/auth/user",
  CREATE_MEMBER_API: BASE_URL + "/auth/member",
  GET_ALL_MEMBER_API: BASE_URL + "/auth/all-members",
  GET_ALL_STORES_API: BASE_URL + "/auth/all-stores",
  UPDATE_MEMBER_PERMISSION_API: BASE_URL + "/auth/update",
  UPDATE_STORE: BASE_URL + "/auth/update-store",

}


export const category = {
  // CREATE_CATEGORY: BASE_URL + "/category/create",
  GET_CATEGORIES: BASE_URL + "/category/getAll",
  // DELETE_CATEGORY: BASE_URL + "/category/delete",
  // UPDATE_CATEGORY: BASE_URL + "/category/update",
}

export const product = {
  CREATE_PRODUCT: BASE_URL + "/product/create",

  GET_ALL_PRODUCT: BASE_URL + "/product/getAll",
  GET_PRODUCT: BASE_URL + "/product/get",
  DELETE_PRODUCT: BASE_URL + "/product/delete",
  UPDATE_PRODUCT: BASE_URL + "/product/update",
  UPDATE_PRODUCT_PRICE: BASE_URL + "/product/update-price",
  UPDATE_BULK_DISCOUNT: BASE_URL + "/product/update-bulk-discounts",
  GET_PRODUCT_BY_STORE: BASE_URL + "/product/get-by-store",
}

export const priceList = {
  CREATE_PRICE_LIST: BASE_URL + "/price-list-templates/create",
  GET_ALL_PRICE_LIST: BASE_URL + "/price-list-templates/getAll",
  GET_PRICE_LIST: BASE_URL + "/price-list-templates/get",
  DELETE_PRICE_LIST: BASE_URL + "/price-list-templates/delete",
  UPDATE_PRICE_LIST: BASE_URL + "/price-list-templates/update",

}
export const order = {
  CREATE_ORDER: BASE_URL + "/order/create",

  GET_ALL_ORDER: BASE_URL + "/order/getAll",
  GET_ORDER: BASE_URL + "/order/get",
  DELETE_ORDER: BASE_URL + "/order/delete",
  UPDATE_ORDER: BASE_URL + "/order/update",
  GET_STORE_ORDERS: BASE_URL + "/order/store-orders",

}
export const crm = {
  CREATE_CONTACT_CRM: BASE_URL + "/crm/create",
  GET_ALL_CONTACT_CRM: BASE_URL + "/crm/getAll",
  UPDATE_CONTACT_CRM: BASE_URL + "/crm/update",
  DELETE_CONTACT_CRM: BASE_URL + "/crm/delete",

  CREATE_MEMBER_CRM: BASE_URL + "/crm/member-create",
  GET_ALL_MEMBER_CRM: BASE_URL + "/crm/member-getAll",
  UPDATE_MEMBER_CRM: BASE_URL + "/crm/member-update",
  DELETE_MEMBER_CRM: BASE_URL + "/crm/member-delete",


}
export const dealCrm = {
  CREATE_DEAL_CRM: BASE_URL + "/crm-deal/create",
  GET_ALL_DEAL_CRM: BASE_URL + "/crm-deal/getAll",
  UPDATE_DEAL_CRM: BASE_URL + "/crm-deal/update",
  DELETE_DEAL_CRM: BASE_URL + "/crm-deal/delete",
}
export const task = {
  CREATE_TASK_CRM: BASE_URL + "/task/create",
  GET_ALL_TASK_CRM: BASE_URL + "/task/getAll",
  UPDATE_TASK_CRM: BASE_URL + "/task/update",
  DELETE_TASK_CRM: BASE_URL + "/task/delete",
}
export const image = {
  IMAGE_UPLOAD: BASE_URL + "/image/multi",
}
export const store = {
  STORE_DASHBOARD: BASE_URL + "/store/dashboard",
  STORE_PRODUCTS: BASE_URL + "/store/products",
  PLACE_ORDER: BASE_URL + "/store/order",
}
export const email = {
  PRICE_LIST: BASE_URL + "/email/price-list",

}
