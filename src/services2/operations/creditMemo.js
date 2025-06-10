import { apiConnector } from "../apiConnector";
import { creditmemos} from "../apis";
import { toast } from 'react-toastify';


const { 
   CREATE_CREDIT_MEMO
} = creditmemos


export const createCreditMemoAPI = async (formData, token) => {
  const toastId = toast.loading("Creating credit memo...");

  try {
    const response = await apiConnector("POST", CREATE_CREDIT_MEMO, formData, {
      Authorization: `Bearer ${token}`,
    });

    const result = response?.data;
console.log(result)
    if (!result?.success) {
      throw new Error(result?.message || "Credit memo creation failed.");
    }

    toast.success(result.message || "Credit memo created successfully!");

    // Return full credit memo response if needed
    return result.creditMemo || null;
  } catch (error) {
    console.error("CREATE_CREDIT_MEMO API ERROR:", error);
    toast.error(error?.response?.data?.message || "Failed to create credit memo.");
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
