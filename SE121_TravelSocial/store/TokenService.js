import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';

export class TokenService {
  // Lưu token sau khi đăng nhập
  static async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('Token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Lấy token
  static async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Lưu user ID
  static async saveUserId(userId) {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
      console.error('Error saving user ID:', error);
    }
  }

  // Lấy user ID
  static async getUserId() {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Xóa token (khi logout)
  static async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_ID_KEY);
      console.log('Token removed successfully');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Kiểm tra token có tồn tại không
  static async hasToken() {
    const token = await this.getToken();
    return token !== null;
  }
}