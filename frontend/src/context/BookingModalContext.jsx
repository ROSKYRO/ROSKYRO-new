import { createContext, useContext, useState } from "react";
import QuickBookModal from "../components/QuickBookModal";

const BookingModalContext = createContext({
  openQuickBook: (serviceId) => {},
  closeQuickBook: () => {},
});

export function BookingModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialServiceId, setInitialServiceId] = useState(null);

  const openQuickBook = (serviceId = null) => {
    setInitialServiceId(serviceId);
    setIsOpen(true);
  };

  const closeQuickBook = () => {
    setIsOpen(false);
    setInitialServiceId(null);
  };

  return (
    <BookingModalContext.Provider value={{ openQuickBook, closeQuickBook }}>
      {children}
      <QuickBookModal
        isOpen={isOpen}
        onClose={closeQuickBook}
        initialServiceId={initialServiceId}
      />
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  return useContext(BookingModalContext);
}
