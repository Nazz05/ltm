import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AddressScreen from './src/screens/AddressScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AdminScreen from './src/screens/AdminScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['sixedishop://', 'exp://'],
  config: {
    screens: {
      Home: '',
      Login: 'login',
      Register: 'register',
      Products: 'products',
      ProductDetail: 'product/:id',
      Cart: 'cart',
      Checkout: 'checkout',
      Search: 'search',
      Profile: 'profile',
      Orders: 'orders',
      Address: 'address',
      Payment: 'payment',
      Admin: 'admin',
      EditProfile: 'edit-profile',
    },
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CartProvider>
          <NavigationContainer linking={linking} theme={navTheme}>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Sixedi Shop' }} />
                <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Sản phẩm' }} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Chi tiết' }} />
                <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh toán' }} />
                <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Tìm kiếm' }} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ' }} />
                <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Đơn hàng của tôi' }} />
                <Stack.Screen name="Address" component={AddressScreen} options={{ title: 'Địa chỉ' }} />
                <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Thanh toán' }} />
                <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Quản trị' }} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Cập nhật thông tin' }} />
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen} 
                  options={{ 
                    title: 'Đăng nhập',
                    presentation: 'modal',
                    animationEnabled: true,
                  }} 
                />
                <Stack.Screen 
                  name="Register" 
                  component={RegisterScreen} 
                  options={{ 
                    title: 'Đăng ký',
                    presentation: 'modal',
                    animationEnabled: true,
                  }} 
                />
              </Stack.Navigator>
            </View>
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
