use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};

/// 密码加密服务
/// 注意：这是一个简化的实现，生产环境应该使用更安全的加密方式
pub struct CryptoService;

impl CryptoService {
    /// 加密密码（使用 base64 编码 + 简单混淆）
    /// 生产环境应该使用系统密钥链或更强的加密算法
    pub fn encrypt_password(password: &str) -> Result<String> {
        // 添加简单的混淆
        let mixed = format!("xmail_{}_secure", password);
        let encoded = general_purpose::STANDARD.encode(mixed.as_bytes());
        Ok(encoded)
    }

    /// 解密密码
    pub fn decrypt_password(encrypted: &str) -> Result<String> {
        let decoded_bytes = general_purpose::STANDARD.decode(encrypted)?;
        let decoded_str = String::from_utf8(decoded_bytes)?;
        
        // 移除混淆前缀和后缀
        if decoded_str.starts_with("xmail_") && decoded_str.ends_with("_secure") {
            let password = &decoded_str[6..decoded_str.len()-7]; // 移除 "xmail_" 和 "_secure"
            Ok(password.to_string())
        } else {
            Err(anyhow::anyhow!("Invalid encrypted password format"))
        }
    }

    /// 验证密码格式
    pub fn validate_password(password: &str) -> Result<()> {
        if password.is_empty() {
            return Err(anyhow::anyhow!("密码不能为空"));
        }
        
        if password.len() < 6 {
            return Err(anyhow::anyhow!("密码长度至少6位"));
        }
        
        Ok(())
    }

    /// 验证邮箱格式
    pub fn validate_email(email: &str) -> Result<()> {
        let email_regex = regex::Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")?;
        
        if !email_regex.is_match(email) {
            return Err(anyhow::anyhow!("邮箱格式不正确"));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_encryption() {
        let password = "test123";
        let encrypted = CryptoService::encrypt_password(password).unwrap();
        let decrypted = CryptoService::decrypt_password(&encrypted).unwrap();
        assert_eq!(password, decrypted);
    }

    #[test]
    fn test_email_validation() {
        assert!(CryptoService::validate_email("test@example.com").is_ok());
        assert!(CryptoService::validate_email("invalid-email").is_err());
    }

    #[test]
    fn test_password_validation() {
        assert!(CryptoService::validate_password("123456").is_ok());
        assert!(CryptoService::validate_password("123").is_err());
        assert!(CryptoService::validate_password("").is_err());
    }
}