// components/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
}

const Header2: React.FC<HeaderProps> = ({ title }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.arrowleftbutton} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/icons/arrowleft.png')} style={styles.arrowlefticon} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
    paddingHorizontal: 100,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 2,
    shadowRadius: 4,
    elevation: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  arrowleftbutton: {
    position: 'absolute',
    left: 10,
  },
  arrowlefticon: {
    width: 40,
    height: 40,
  },
});

export default Header2;
