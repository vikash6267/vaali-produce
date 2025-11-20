import React, { useEffect, useState } from "react";
import Select from "react-select";
import { getAllStoresAPI } from "@/services2/operations/auth";
import { sendOrderToStoreAPI } from "@/services2/operations/priceList";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";


function SendOrderToStore({ open, onClose, template }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = useSelector((state: RootState) => state.auth?.token ?? null);

  useEffect(() => {
    if (!open) return;

    const fetchStores = async () => {
      try {
        const storesData = await getAllStoresAPI();
        const formattedStores = storesData.map(({ email, storeName }) => ({
          value: email,
          label: storeName,
        }));
        setStores(formattedStores);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to fetch stores");
      }
    };

    fetchStores();
  }, [open]);

  const sendTemplateToStore = async () => {
    if (!selectedStore) {
      toast.warning("Please select a store first!");
      return;
    }

    const url = `https://valiproduce.shop/store/template?templateId=${template.id}&email=${selectedStore.value}`;
    
    const formData ={
      email :selectedStore.value,
      url
    }

    try {
      setLoading(true);
      const response = await sendOrderToStoreAPI(formData, token)
      onClose(); 
    } catch (error) {
      console.error("Error sending template:", error);
      toast.error("Failed to send template. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[400px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Store</DialogTitle>
          <DialogDescription>
            Please select a store from the dropdown.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex-grow">
          <Select
            options={stores}
            value={selectedStore}
            onChange={setSelectedStore}
            placeholder="Search and select a store..."
            isSearchable
            isMulti={false}
            styles={{
              container: (base) => ({ ...base, width: "100%" }),
            }}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={sendTemplateToStore}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SendOrderToStore;
