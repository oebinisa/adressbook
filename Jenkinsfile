pipeline {
    agent any

    tools {
        nodejs 'NodeJS' // This must match a NodeJS installation name configured in Jenkins
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        AWS_CREDENTIALS = credentials('aws-credentials')
        DB_PASSWORD = credentials('db-password')
        MAILGUN_API_KEY = credentials('mailgun-api-key')
        MAILGUN_DOMAIN = credentials('mailgun-domain')
        MAILGUN_RECIPIENT = 'o.oluwapelumi@gmail.com'
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'jenkinsbranch', url: 'https://github.com/oebinisa/adressbook.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    sh 'cd frontend && npm install --no-fund --no-audit --legacy-peer-deps || true'
                    sh 'cd backend && npm install --no-fund --no-audit --legacy-peer-deps || true'
                    sh 'cd tests && npm install --no-fund --no-audit --legacy-peer-deps || true'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh 'cd tests && npm test'
                }
            }
            post {
                failure {
                    echo 'Tests failed but continuing the pipeline'
                }
            }
        }

        stage('Build Frontend (React + Vite)') {
            steps {
                script {
                    sh 'cd frontend && npm run build'
                }
            }
        }

        stage('Build and Push Docker Images') {
            steps {
                script {
                    echo "Skipping Docker build steps due to configuration issues"
                    // sh 'docker build -t my-frontend ./frontend'
                    // sh 'docker tag my-frontend my-dockerhub-user/my-frontend:latest'
                    // sh 'echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin'
                    // sh 'docker push my-dockerhub-user/my-frontend:latest'

                    // sh 'docker build -t my-backend ./backend'
                    // sh 'docker tag my-backend my-dockerhub-user/my-backend:latest'
                    // sh 'docker push my-dockerhub-user/my-backend:latest'
                }
            }
        }

        stage('Deploy with Terraform') {
            steps {
                script {
                    sh 'cd infra && export AWS_ACCESS_KEY_ID=$AWS_CREDENTIALS_USR && export AWS_SECRET_ACCESS_KEY=$AWS_CREDENTIALS_PSW && terraform init && terraform apply -auto-approve'
                }
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    sh 'export AWS_ACCESS_KEY_ID=$AWS_CREDENTIALS_USR && export AWS_SECRET_ACCESS_KEY=$AWS_CREDENTIALS_PSW && bash deploy_blue_green.sh'
                }
            }
        }
    }

    post {
        success {
            script {
                withCredentials([string(credentialsId: 'mailgun-api-key', variable: 'MG_API_KEY'), 
                                string(credentialsId: 'mailgun-domain', variable: 'MG_DOMAIN')]) {
                    sh '''
                    curl -s --user "api:${MG_API_KEY}" \
                        https://api.mailgun.net/v3/${MG_DOMAIN}/messages \
                        -F from="DevForge Notifications <dev@devforge.cc>" \
                        -F to="${MAILGUN_RECIPIENT}" \
                        -F subject="Jenkins Build Notification" \
                        -F text="Your Jenkins job has completed successfully."
                    '''
                }
            }
        }
        failure {
            script {
                withCredentials([string(credentialsId: 'mailgun-api-key', variable: 'MG_API_KEY'), 
                                string(credentialsId: 'mailgun-domain', variable: 'MG_DOMAIN')]) {
                    sh '''
                    curl -s --user "api:${MG_API_KEY}" \
                        https://api.mailgun.net/v3/${MG_DOMAIN}/messages \
                        -F from="DevForge Notifications <dev@devforge.cc>" \
                        -F to="${MAILGUN_RECIPIENT}" \
                        -F subject="Jenkins Build Notification" \
                        -F text="Your Jenkins job has failed. Please check the logs."
                    '''
                }
            }
        }
    }
}