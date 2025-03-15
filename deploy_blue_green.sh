#!/bin/bash

set -e

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "AWS credentials not set. Exiting."
    exit 1
fi

# Load Balancer and Target Group Names
LB_NAME="addressbook-lb"
BLUE_TG_NAME="addressbook-blue-tg"
GREEN_TG_NAME="addressbook-green-tg"

# Get current active target group
ACTIVE_TG=$(aws elbv2 describe-listeners \
    --load-balancer-arn $(aws elbv2 describe-load-balancers --names $LB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text) \
    --query 'Listeners[0].DefaultActions[0].TargetGroupArn' --output text)

# Determine which target group is active
if [[ $ACTIVE_TG == *"blue"* ]]; then
    echo "Blue environment is active. Switching to Green."
    NEW_TG_NAME=$GREEN_TG_NAME
    NEW_VERSION="green"
    OLD_VERSION="blue"
else
    echo "Green environment is active. Switching to Blue."
    NEW_TG_NAME=$BLUE_TG_NAME
    NEW_VERSION="blue"
    OLD_VERSION="green"
fi

# Get the new target group ARN
NEW_TG=$(aws elbv2 describe-target-groups --names $NEW_TG_NAME --query 'TargetGroups[0].TargetGroupArn' --output text)

# Start new version EC2 instances if they're stopped
INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=tag:App,Values=addressbook" "Name=tag:Version,Values=$NEW_VERSION" "Name=instance-state-name,Values=stopped" \
    --query "Reservations[].Instances[].InstanceId" --output text)

if [ ! -z "$INSTANCES" ]; then
    echo "Starting $NEW_VERSION instances: $INSTANCES"
    aws ec2 start-instances --instance-ids $INSTANCES
    
    # Wait for instances to be running
    aws ec2 wait instance-running --instance-ids $INSTANCES
    
    # Wait additional time for application to start
    echo "Waiting for application to start..."
    sleep 60
fi

# Register instances with the new target group
INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=tag:App,Values=addressbook" "Name=tag:Version,Values=$NEW_VERSION" "Name=instance-state-name,Values=running" \
    --query "Reservations[].Instances[].InstanceId" --output text)

if [ ! -z "$INSTANCES" ]; then
    for INSTANCE in $INSTANCES; do
        echo "Registering instance $INSTANCE with target group $NEW_TG_NAME"
        aws elbv2 register-targets --target-group-arn $NEW_TG --targets Id=$INSTANCE
    done
fi

# Modify listener to use the new target group
LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $(aws elbv2 describe-load-balancers --names $LB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text) \
    --query 'Listeners[0].ListenerArn' --output text)

echo "Switching load balancer to $NEW_VERSION environment"
aws elbv2 modify-listener --listener-arn $LISTENER_ARN --default-actions Type=forward,TargetGroupArn=$NEW_TG

# Wait for health checks to pass
echo "Waiting for health checks to pass..."
sleep 30

# Stop old version instances to save costs
INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=tag:App,Values=addressbook" "Name=tag:Version,Values=$OLD_VERSION" "Name=instance-state-name,Values=running" \
    --query "Reservations[].Instances[].InstanceId" --output text)

if [ ! -z "$INSTANCES" ]; then
    echo "Stopping $OLD_VERSION instances: $INSTANCES"
    aws ec2 stop-instances --instance-ids $INSTANCES
fi

echo "Blue-Green deployment complete. Now serving traffic from $NEW_VERSION environment."