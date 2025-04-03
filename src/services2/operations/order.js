import { apiConnector } from "../apiConnector";
import { order, product } from "../apis";
import { toast } from 'react-toastify';


const { CREATE_PRODUCT,
    CREATE_ORDER,
    GET_ALL_ORDER, 
    GET_ORDER
} = order


export const createOrderAPI = async (formData, token) => {

    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("POST", CREATE_ORDER, formData, {
            Authorization: `Bearer ${token}`,
        });

        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }


        toast.success(response?.data?.message);

        return response;
    } catch (error) {
        console.error("CREATE_ORDER  API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to CREATE_ORDER!");
        return null;
    } finally {

        toast.dismiss(toastId);
    }
};


export const getAllOrderAPI = async (token) => {

    try {
        const response = await apiConnector("GET", GET_ALL_ORDER,{},{
            Authorization: `Bearer ${token}`,
        })


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        return response?.data?.orders || [];
    } catch (error) {
        console.error("GET GET_ALL_ORDER API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get GET_ALL_ORDER!");
        return [];
    }

};