import { apiConnector } from "../apiConnector";
import { product } from "../apis";
import { toast } from 'react-toastify';


const { CREATE_PRODUCT, 
    GET_ALL_PRODUCT, 
    GET_PRODUCT, 
    DELETE_PRODUCT, 
    UPDATE_PRODUCT, 
    UPDATE_PRODUCT_PRICE,
    UPDATE_BULK_DISCOUNT,
    GET_PRODUCT_ORDER,
    GET_ALL_PRODUCT_SUMMARY
} = product

export const createProductAPI = async (formData, token) => {

    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("POST", CREATE_PRODUCT, formData, {
            Authorization: `Bearer ${token}`,
        });

        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }


        toast.success(response?.data?.message);

        return response;
    } catch (error) {
        console.error("Product  API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to create Product!");
        return null;
    } finally {

        toast.dismiss(toastId);
    }
};
export const updateProductPrice = async (formData, token) => {
    // Show a loading toast message
    const toastId = toast.loading("Updating product price...");

    try {
        // API call to update product price
        const response = await apiConnector("PUT", UPDATE_PRODUCT_PRICE, formData, {
            Authorization: `Bearer ${token}`,
        });

        // Check if the request was successful
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        // Show success toast notification
        toast.success(response.data.message);

        return response.data; // Return the response data
    } catch (error) {
        console.error("Product Price Update API Error:", error);

        // Show error toast notification
        toast.error(error?.response?.data?.message || "Failed to update product price!");

        return null;
    } finally {
        // Dismiss the loading toast
        toast.dismiss(toastId);
    }
};


export const updateBulkDiscount = async (product,formData, token) => {
    // Show a loading toast message
    const toastId = toast.loading("Updating product price...");

    try {
        // API call to update product price
        const response = await apiConnector("PUT", `${UPDATE_BULK_DISCOUNT}`, {formData,product}, {
            Authorization: `Bearer ${token}`,
        });

        // Check if the request was successful
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        // Show success toast notification
        toast.success(response.data.message);

        return response.data; // Return the response data
    } catch (error) {
        console.error("Product Price Update API Error:", error);

        // Show error toast notification
        toast.error(error?.response?.data?.message || "Failed to update product price!");

        return null;
    } finally {
        // Dismiss the loading toast
        toast.dismiss(toastId);
    }
};



export const getAllProductAPI = async () => {

    try {
        const response = await apiConnector("GET", GET_ALL_PRODUCT,)


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        return response?.data?.products || [];
    } catch (error) {
        console.error("GET Product API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get product!");
        return [];
    }

};

export const getAllProductSummaryAPI = async () => {

    try {
        const response = await apiConnector("GET", GET_ALL_PRODUCT_SUMMARY,)


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }
console.log(response?.data)
        return response?.data?.data || [];
    } catch (error) {
        console.error("GET Product API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get product!");
        return [];
    }

};



export const getSingleProductAPI = async (id) => {


    try {
        const response = await apiConnector("GET", `${GET_PRODUCT}/${id}`)


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        return response?.data?.product
    } catch (error) {
        console.error("GET Product API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get product!");
        return false;
    } finally {

    }

};
export const getSingleProductOrderAPI = async (id) => {


    try {
        const response = await apiConnector("GET", `${GET_PRODUCT_ORDER}/${id}`)


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }
       

        return response?.data
    } catch (error) {
        console.error("GET Product API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get product!");
        return false;
    } finally {

    }

};

export const deleteProductAPI = async (id,) => {
    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("DELETE", `${DELETE_PRODUCT}/${id}`);


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }
        toast.success(response?.data?.message);
        toast.dismiss(toastId);

        return response?.data;
    } catch (error) {
        console.error("DELETE product API ERROR:", error);
        toast.dismiss(toastId);

        toast.error(error?.response?.data?.message || "Failed to delete product!");
        return [];
    }
    toast.dismiss(toastId);


};
export const updateProductAPI = async (id, formData, token) => {

    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("PUT", `${UPDATE_PRODUCT}/${id}`, formData, {
            Authorization: `Bearer ${token}`,
        });


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        console.log(response)
        return response?.data;
    } catch (error) {
        console.error("UPDATE Product API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to Update product!");
        return [];
    } finally {

        toast.dismiss(toastId);
    }

};




