import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Signup({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Vui lòng nhập đủ thông tin');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Đăng ký thất bại', error.message);
      return;
    }

    const user = data.user;
    if (user) {
      await supabase.from('profiles').insert([
        {
          id: user.id,
          full_name: fullName,
          email: email,
        },
      ]);
      Alert.alert('Đăng ký thành công', 'Hãy đăng nhập để tiếp tục');
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Đăng ký</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12,
    marginBottom: 16, fontSize: 16,
  },
  button: { backgroundColor: '#007bff', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, color: '#007bff', textAlign: 'center' },
});
