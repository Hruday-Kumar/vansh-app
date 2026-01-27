/**
 * 🪷 LOGIN/SIGNUP SCREEN
 * Beautiful authentication screen for Vansh with biometric support
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SacredText, SilkButton } from '../src/components';
import { useAuth } from '../src/hooks';
import {
    authenticateWithBiometrics,
    getBiometricCapabilities,
    getBiometricName,
    type BiometricCapabilities,
} from '../src/services/biometrics';
import { useAuthStore } from '../src/state';
import { VanshColors, VanshSpacing } from '../src/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, register, isLoading, error } = useAuth();
  const { biometricEnabled } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [surname, setSurname] = useState('');
  const [memberName, setMemberName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Biometric state
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  
  // Check biometric capabilities on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const capabilities = await getBiometricCapabilities();
      setBiometricCapabilities(capabilities);
      
      // Auto-trigger biometric if enabled and available
      if (biometricEnabled && capabilities.hasHardware && capabilities.isEnrolled) {
        handleBiometricLogin();
      }
    };
    checkBiometrics();
  }, []);
  
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setLocalError(null);
    
    try {
      const result = await authenticateWithBiometrics('वंश में लॉगिन करने के लिए सत्यापित करें');
      
      if (result.success) {
        // Biometric success - user is already authenticated via stored credentials
        router.replace('/(tabs)');
      } else if (result.error) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };
  
  const handleLogin = async () => {
    setLocalError(null);
    
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password');
      return;
    }
    
    const success = await login(email.trim(), password);
    
    if (success) {
      // Ask to enable biometrics if available and not already enabled
      if (biometricCapabilities?.hasHardware && biometricCapabilities?.isEnrolled && !biometricEnabled) {
        const biometricName = getBiometricName(biometricCapabilities.types);
        Alert.alert(
          `${biometricName} सक्षम करें?`,
          `अगली बार तेज़ लॉगिन के लिए ${biometricName} का उपयोग करें`,
          [
            { text: 'बाद में', style: 'cancel', onPress: () => router.replace('/(tabs)') },
            { 
              text: 'सक्षम करें', 
              onPress: async () => {
                useAuthStore.getState().setBiometricEnabled(true);
                router.replace('/(tabs)');
              }
            },
          ]
        );
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setLocalError(error || 'Invalid email or password. Please try again.');
    }
  };
  
  const handleSignup = async () => {
    setLocalError(null);
    
    if (!email.trim() || !password.trim() || !familyName.trim() || !surname.trim() || !memberName.trim()) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    const success = await register(email.trim(), password, familyName.trim(), surname.trim(), memberName.trim());
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      setLocalError(error || 'Registration failed. Please try again.');
    }
  };
  
  const displayError = localError || error;
  const canUseBiometric = biometricEnabled && biometricCapabilities?.hasHardware && biometricCapabilities?.isEnrolled;
  const biometricName = biometricCapabilities ? getBiometricName(biometricCapabilities.types) : '';
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Branding */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <SacredText variant="hero" color="gold" style={styles.logoEmoji}>🪷</SacredText>
          </View>
          <SacredText variant="displayLarge" color="gold" align="center">
            Vansh
          </SacredText>
          <SacredText variant="title" color="secondary" align="center" style={styles.tagline}>
            वंश • Your Family's Living Heritage
          </SacredText>
        </Animated.View>
        
        {/* Biometric Login Button */}
        {canUseBiometric && mode === 'login' && (
          <Animated.View entering={FadeIn.delay(150)} style={styles.biometricSection}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
              accessibilityLabel={`${biometricName} से लॉगिन करें`}
              accessibilityRole="button"
            >
              {biometricLoading ? (
                <ActivityIndicator size="large" color={VanshColors.suvarna[500]} />
              ) : (
                <>
                  <Ionicons 
                    name={biometricCapabilities?.types.includes('facial') ? 'scan' : 'finger-print'} 
                    size={48} 
                    color={VanshColors.suvarna[500]} 
                  />
                  <SacredText variant="body" color="primary" style={styles.biometricText}>
                    {biometricName} से लॉगिन करें
                  </SacredText>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <SacredText variant="caption" color="muted" style={styles.dividerText}>
                या
              </SacredText>
              <View style={styles.dividerLine} />
            </View>
          </Animated.View>
        )}
        
        {/* Mode Toggle */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.modeToggle}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
            onPress={() => { setMode('login'); setLocalError(null); }}
          >
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}
            onPress={() => { setMode('signup'); setLocalError(null); }}
          >
            <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Error Display */}
        {displayError && (
          <Animated.View entering={FadeIn} style={styles.errorContainer}>
            <SacredText variant="body" color="vermilion" align="center">
              ⚠️ {displayError}
            </SacredText>
          </Animated.View>
        )}
        
        {/* Login Form */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.formSection}>
          {mode === 'signup' && (
            <>
              <View style={styles.inputContainer}>
                <SacredText variant="label" color="muted" style={styles.inputLabel}>
                  Your Name
                </SacredText>
                <TextInput
                  style={styles.input}
                  value={memberName}
                  onChangeText={setMemberName}
                  placeholder="e.g., Arjun Kumar"
                  placeholderTextColor={VanshColors.khadi[400]}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.rowInputs}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <SacredText variant="label" color="muted" style={styles.inputLabel}>
                    Family Name
                  </SacredText>
                  <TextInput
                    style={styles.input}
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="e.g., Sharma"
                    placeholderTextColor={VanshColors.khadi[400]}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <SacredText variant="label" color="muted" style={styles.inputLabel}>
                    Surname
                  </SacredText>
                  <TextInput
                    style={styles.input}
                    value={surname}
                    onChangeText={setSurname}
                    placeholder="e.g., Sharma"
                    placeholderTextColor={VanshColors.khadi[400]}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </>
          )}
          
          <View style={styles.inputContainer}>
            <SacredText variant="label" color="muted" style={styles.inputLabel}>
              Email Address
            </SacredText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={VanshColors.khadi[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <SacredText variant="label" color="muted" style={styles.inputLabel}>
              Password
            </SacredText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                placeholderTextColor={VanshColors.khadi[400]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <SacredText variant="caption" color="primary">
                  {showPassword ? 'Hide' : 'Show'}
                </SacredText>
              </TouchableOpacity>
            </View>
          </View>
          
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <SacredText variant="label" color="muted" style={styles.inputLabel}>
                Confirm Password
              </SacredText>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={VanshColors.khadi[400]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
          
          <SilkButton
            variant="primary"
            label={isLoading 
              ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') 
              : (mode === 'login' ? 'Sign In' : 'Create Account')
            }
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={isLoading}
            style={styles.loginButton}
          />
          
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color={VanshColors.suvarna[500]} 
              style={styles.loader}
            />
          )}
        </Animated.View>
        
        {/* Demo Credentials - Only for login */}
        {mode === 'login' && (
          <Animated.View entering={FadeIn.delay(600)} style={styles.demoSection}>
            <View style={styles.demoDivider}>
              <View style={styles.dividerLine} />
              <SacredText variant="caption" color="muted" style={styles.dividerText}>
                Demo Account
              </SacredText>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={() => {
                setEmail('arjun@example.com');
                setPassword('vansh123');
                setLocalError(null);
              }}
            >
              <SacredText variant="body" color="primary" align="center">
                Use Demo Credentials
              </SacredText>
              <SacredText variant="caption" color="muted" align="center">
                arjun@example.com / vansh123
              </SacredText>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Footer */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
          <SacredText variant="caption" color="muted" align="center">
            Preserve your family's stories, traditions, and memories
          </SacredText>
          <SacredText variant="caption" color="muted" align="center">
            for generations to come 🙏
          </SacredText>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VanshColors.khadi[50],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: VanshSpacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: VanshSpacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: VanshSpacing.sm,
    shadowColor: VanshColors.suvarna[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  tagline: {
    marginTop: VanshSpacing.xs,
    opacity: 0.8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: VanshColors.khadi[200],
    borderRadius: 12,
    padding: 4,
    marginBottom: VanshSpacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: VanshSpacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: VanshColors.khadi[50],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.khadi[600],
  },
  modeTextActive: {
    color: VanshColors.suvarna[600],
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: VanshSpacing.md,
    marginBottom: VanshSpacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  formSection: {
    marginBottom: VanshSpacing.lg,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: VanshSpacing.md,
  },
  inputLabel: {
    marginBottom: VanshSpacing.xs,
    marginLeft: VanshSpacing.xs,
  },
  input: {
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 1,
    borderColor: VanshColors.khadi[300],
    borderRadius: 12,
    paddingHorizontal: VanshSpacing.md,
    paddingVertical: VanshSpacing.md,
    fontSize: 16,
    color: VanshColors.masi[900],
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  showPasswordButton: {
    position: 'absolute',
    right: VanshSpacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  loginButton: {
    marginTop: VanshSpacing.sm,
  },
  loader: {
    marginTop: VanshSpacing.md,
  },
  demoSection: {
    marginBottom: VanshSpacing.lg,
  },
  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: VanshSpacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: VanshColors.khadi[300],
  },
  dividerText: {
    marginHorizontal: VanshSpacing.md,
  },
  demoButton: {
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 1,
    borderColor: VanshColors.suvarna[300],
    borderRadius: 12,
    paddingVertical: VanshSpacing.md,
    paddingHorizontal: VanshSpacing.lg,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: VanshSpacing.md,
  },
  // Biometric styles
  biometricSection: {
    alignItems: 'center',
    marginBottom: VanshSpacing.lg,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.khadi[100],
    borderWidth: 2,
    borderColor: VanshColors.suvarna[300],
    borderRadius: 20,
    paddingVertical: VanshSpacing.xl,
    paddingHorizontal: VanshSpacing['2xl'],
    minWidth: 200,
  },
  biometricText: {
    marginTop: VanshSpacing.sm,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: VanshSpacing.lg,
    width: '100%',
  },
});
