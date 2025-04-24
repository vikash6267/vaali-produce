import { apiConnector } from "../apiConnector";
import { order, product } from "../apis";
import { toast } from 'react-toastify';


const { CREATE_PRODUCT,
    CREATE_ORDER,
    GET_ALL_ORDER, 
    GET_ORDER,
    UPDATE_ORDER,
    UPDATE_PLATE_ORDER,
    UPDATE_PAYMENT_ORDER
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


export const getOrderAPI = async (id,token) => {

    try {
        const response = await apiConnector("GET", `${GET_ORDER}/${id}`,{},{
            Authorization: `Bearer ${token}`,
        })


        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }

        return response?.data?.order || [];
    } catch (error) {
        console.error("GET GET_ALL_ORDER API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to get GET_ALL_ORDER!");
        return [];
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

export const updateOrderAPI = async (formData, token,id) => {

    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("PUT", `${UPDATE_ORDER}/${id}`, formData, {
            Authorization: `Bearer ${token}`,
        });

        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }


        toast.success(response?.data?.message);

        return response;
    } catch (error) {
        console.error("updateOrderAPI  API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to updateOrderAPI!");
        return null;
    } finally {

        toast.dismiss(toastId);
    }
};


export const updateOrderPaymentAPI = async (formData, token, id) => {
    const toastId = toast.loading("Updating payment...");
  
    try {
      const response = await apiConnector(
        "PUT",
        `${UPDATE_PAYMENT_ORDER}/${id}`,
        formData, // ✅ Send formData directly, not wrapped inside an object
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // 👈 Only if formData is a plain JS object
        }
      );
  
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Something went wrong!");
      }
  
      toast.success(response?.data?.message || "Payment updated successfully");
      return response;
    } catch (error) {
      console.error("updateOrderPaymentAPI ERROR:", error);
      toast.error(error?.response?.data?.message || "Payment update failed!");
      return null;
    } finally {
      toast.dismiss(toastId);
    }
  };
  



export const updateOrderPlateAPI = async (palletData, token,id) => {
console.log(palletData)
    const toastId = toast.loading("Loading...");


    try {
        const response = await apiConnector("PUT", `${UPDATE_PLATE_ORDER}/${id}`, {palletData:palletData}, {
            Authorization: `Bearer ${token}`,
        });

        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Something went wrong!");
        }


        toast.success(response?.data?.message);

        return response;
    } catch (error) {
        console.error("updateOrderAPI  API ERROR:", error);
        toast.error(error?.response?.data?.message || "Failed to updateOrderAPI!");
        return null;
    } finally {

        toast.dismiss(toastId);
    }
};