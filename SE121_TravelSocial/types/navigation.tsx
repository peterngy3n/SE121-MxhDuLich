// types/navigation.ts

export type SelectedRoom = {
    roomId: string;
    count: number;
    roomDetails: {
      name: string;
      price: number;
      checkinDate: Date;
      checkoutDate: Date;
    };
    nights: number;
  };
  
  export type RootStackParamList = {
    'welcome1': undefined;
    'login': undefined;
    'register': undefined;
    'register2': undefined;
    'collection-screen': undefined;
    'add-new-collection-screen': undefined;
    'personal-information-screen': undefined;
    'notifications-screen': undefined;
    'chat-board-screen': undefined;
    'chat-screen': { conversationId: string, userName: string};
    'main-screen': undefined;
    'payment-method-screen': { 
      bookingId: string; 
      locationId: string; 
      totalPrice: string; 
      selectedRoomsData: SelectedRoom[];
      ImageUrl?: string | { url: string }[];
      checkinDate?: Date | string;
      checkoutDate?: Date | string;
    };
    'add-new-payment-method-screen': undefined;
    'reservation-required-screen': { selectedRoomsData: SelectedRoom[], selectedServicesData: any,locationId: string};
    'available-room-screen': { id: string; checkinDate: Date; checkoutDate: Date; serviceOfLocation: any };
    'detail-screen': { id: string };
    'detail-booking-screen': {bookingId: string; title: string; status: string};
    'booking-screen': undefined;
    'lucky-wheel-screen': undefined;
    'search-location-screen': undefined;
    'profile-social-screen': undefined;
    'search-friend-screen': undefined;
    'notifications-social-screen': undefined;
    'new-post-screen': undefined;
    'view-map-screen': undefined;
    'voucher-screen': undefined;
    'post-detail-screen': { postId: string };
    'friends-list-screen': { userId: string };
    
  };
