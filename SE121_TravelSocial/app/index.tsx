import { View, Text, LogBox } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = { fontFamily: 'UTMTimesBold' };

import WelcomeScreen1 from '@/screen/Welcome/WelcomeScreen1'
import LoginScreen from '@/screen/Welcome/LoginScreen'
import RegisterScreen from '@/screen/Welcome/RegisterScreen'
import MainScreen from '@/screen/MainScreen'
import React from 'react'
import RegisterScreen2 from '@/screen/Welcome/RegisterScreen2'
import AddNewCollectionScreen from '@/screen/AddNewCollectionScreen'
import CollectionScreen from '@/screen/CollectionScreen'
import PersonalInformationScreen from '@/screen/PersonalInformationScreen'
import NotificationsScreen from '@/screen/NotificationsScreen'
import ChatBoardScreen from '@/screen/ChatBoardScreen'
import ChatScreen from '@/screen/ChatScreen'
import PaymentMethodScreen from '@/screen/PaymentMethodScreen'
import AddNewPaymentMethodScreen from '@/screen/AddNewPaymentMethodScreen'
import ReservationRequiredScreen from '@/screen/ReservationRequiredScreen'
import AvailableRoomScreen from '@/screen/AvailableRoomScreen'
import DetailScreen1 from '@/screen/HomeScreen/DetailScreen1'
import DetailScreen from '@/screen/HomeScreen/DetailScreen'
import { UserProvider } from '@/context/UserContext'
import { SocketProvider } from '@/context/SocketContext';
import { RootStackParamList } from '@/types/navigation'
import DetailBookingScreen from '@/screen/DetailBookingScreen';
import TicketScreen from '@/screen/TicketScreen';
import LuckyWheelScreen from '@/screen/LuckyWheelScreen';
import SearchLocationScreen from '@/screen/SearchLocationScreen';
import ProfileSocialScreen from '@/screen/ProfileSocialScreen';
import SearchFriendScreen from '@/screen/SearchFriendScreen';
import NotificationsSocialScreen from '@/screen/NotificationsSocialScreen';
import NewPostScreen from '@/screen/NewPostScreen';
import ViewMapScreen from '@/screen/ViewMapScreen';
import VoucherScreen from '@/screen/VoucherScreen';
import SocialScreen from '@/screen/SocialScreen';
import PostDetailScreen from '@/screen/PostDetailScreen';
import FriendsListScreen from '@/screen/FriendsListScreen';


LogBox.ignoreLogs([
  'Encountered two children with the same key',
  'Text strings must be rendered within a <Text> component.',
  'A props object containing a "key" prop is being spread into JSX'
]);

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (

    <NavigationContainer independent={true}>
      <UserProvider>
        <SocketProvider>
          <Stack.Navigator
            initialRouteName='login'>
            <Stack.Screen
              name="welcome1"
              component={WelcomeScreen1}
              options={{
                headerShown: false,
                headerTransparent: true,
              }} />

            <Stack.Screen
              name="login"
              component={LoginScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="register"
              component={RegisterScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="register2"
              component={RegisterScreen2}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="collection-screen"
              component={CollectionScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="add-new-collection-screen"
              component={AddNewCollectionScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="personal-information-screen"
              component={PersonalInformationScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="notifications-screen"
              component={NotificationsScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="chat-board-screen"
              component={ChatBoardScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="chat-screen"
              component={ChatScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="main-screen"
              component={MainScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="payment-method-screen"
              component={PaymentMethodScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="add-new-payment-method-screen"
              component={AddNewPaymentMethodScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="reservation-required-screen"
              component={ReservationRequiredScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="available-room-screen"
              component={AvailableRoomScreen}
              options={{
                headerShown: false
              }} />
            <Stack.Screen
              name='detail-screen'
              component={DetailScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name="detail-booking-screen"
              component={DetailBookingScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='booking-screen'
              component={TicketScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='lucky-wheel-screen'
              component={LuckyWheelScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='search-location-screen'
              component={SearchLocationScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='profile-social-screen'
              component={ProfileSocialScreen}
              options={{
                headerShown: false
              }} />
            <Stack.Screen
              name='search-friend-screen'
              component={SearchFriendScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='notifications-social-screen'
              component={NotificationsSocialScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='new-post-screen'
              component={NewPostScreen}
              options={{
                headerShown: false
              }} />
            <Stack.Screen
              name='view-map-screen'
              component={ViewMapScreen}
              options={{
                headerShown: false
              }} />
            <Stack.Screen
              name='voucher-screen'
              component={VoucherScreen}
              options={{
                headerShown: false
              }} />
            <Stack.Screen
              name='post-detail-screen'
              component={PostDetailScreen}
              options={{
                headerShown: false
              }} />

            <Stack.Screen
              name='friends-list-screen'
              component={FriendsListScreen}
              options={{
                headerShown: false
              }} />

          </Stack.Navigator>
        </SocketProvider>
      </UserProvider>
    </NavigationContainer>


  );
}