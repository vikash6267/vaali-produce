import { apiConnector } from "../apiConnector";
import { category } from "../apis";
import { toast } from "react-toastify";
import { setLoading } from "../../redux/authSlice";

const { GET_CATEGORIES, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } = category;

/**
 * 📥 Get all categories
 */
export const getAllCategoriesAPI = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("GET", GET_CATEGORIES);

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to fetch categories!");
      }

      return {
        success: true,
        categories: response.data.categories || [],
      };
    } catch (error) {
      console.error("GET CATEGORIES ERROR:", error);
      toast.error(error?.response?.data?.message || "Failed to get categories!");
      return { success: false, categories: [] };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/**
 * ➕ Create a new category
 */
export const addCategoryAPI = async(formData, token) => {

    const toastId = toast.loading("Adding category...");

    try {
      const response = await apiConnector("POST", CREATE_CATEGORY, formData, {
        Authorization: `Bearer ${token}`,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to create category!");
      }

      toast.success("Category added successfully!");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("CREATE CATEGORY ERROR:", error);
      toast.error(error?.response?.data?.message || "Failed to create category!");
      return { success: false };
    } finally {
      toast.dismiss(toastId);
    }
  };


/**
 * ✏️ Update existing category
 */
export const updateCategoryAPI = (id, formData, token) => {
  return async () => {
    const toastId = toast.loading("Updating category...");

    try {
      const response = await apiConnector(
        "PUT",
        `${UPDATE_CATEGORY}/${id}`,
        formData,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to update category!");
      }

      toast.success("Category updated successfully!");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("UPDATE CATEGORY ERROR:", error);
      toast.error(error?.response?.data?.message || "Failed to update category!");
      return { success: false };
    } finally {
      toast.dismiss(toastId);
    }
  };
};

/**
 * 🗑️ Delete category
 */
export const deleteCategoryAPI = (id, token) => {
  return async () => {
    const toastId = toast.loading("Deleting category...");

    try {
      const response = await apiConnector(
        "DELETE",
        `${DELETE_CATEGORY}/${id}`,
        {},
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to delete category!");
      }

      toast.success("Category deleted successfully!");
      return { success: true };
    } catch (error) {
      console.error("DELETE CATEGORY ERROR:", error);
      toast.error(error?.response?.data?.message || "Failed to delete category!");
      return { success: false };
    } finally {
      toast.dismiss(toastId);
    }
  };
};

